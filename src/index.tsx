import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  staticClasses,
  Router,
  sleep,
  Focusable,
} from "@decky/ui";
import { GiWalkieTalkie } from "react-icons/gi";

import { patchMenu } from "./patches/menuPatch";
import { DiscordTab } from "./components/DiscordTab";
import {
  useDeckcordState,
  isLoaded,
  isLoggedIn,
} from "./hooks/useDeckcordState";

import { MuteButton } from "./components/buttons/MuteButton";
import { DeafenButton } from "./components/buttons/DeafenButton";
import { DisconnectButton } from "./components/buttons/DisconnectButton";
import { PushToTalkButton } from "./components/buttons/PushToTalk";
import {
  VoiceChatChannel,
  VoiceChatMembers,
} from "./components/VoiceChatViews";
import { UploadScreenshot } from "./components/UploadScreenshot";
import { OpenDiscordButton } from "./components/buttons/OpenCloseDiscordButton";
import {
  call,
  routerHook,
  toaster,
  addEventListener,
  removeEventListener,
} from "@decky/api";

declare global {
  interface Window {
    DISCORD_TAB: any;
    DECKCORD: {
      dispatchNotification: any;
      MIC_PEER_CONNECTION: any;
    };
  }
}

const Content = () => {
  const state = useDeckcordState();
  if (!state?.loaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h2>TacCord loading...</h2>
      </div>
    );
  } else if (!state?.logged_in) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          paddingLeft: "15px",
        }}
      >
        <h2>Not logged in!</h2>
        <h3>
          Open{" "}
          <b>
            <GiWalkieTalkie />
            TacCord
          </b>{" "}
          from the Steam Menu and login.
        </h3>
        <h4>If you did not logout, just wait for a few seconds.</h4>
      </div>
    );
  } else {
    return (
      <PanelSection>
        <div style={{ marginBottom: "12px" }}>
          <PanelSectionRow>
            <OpenDiscordButton />
          </PanelSectionRow>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <PanelSectionRow>
            <Focusable style={{ display: "flex", justifyContent: "center" }}>
              <MuteButton />
              <DeafenButton />
              <DisconnectButton />
            </Focusable>
          </PanelSectionRow>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <PanelSectionRow>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "6px",
                paddingLeft: "24px",
              }}
            >
              <PushToTalkButton />
            </div>
          </PanelSectionRow>
        </div>
        <hr style={{ marginTop: "8px" }}></hr>
        <div style={{ marginBottom: "12px" }}>
          <PanelSectionRow>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={
                  "https://cdn.discordapp.com/avatars/" +
                  state?.me?.id +
                  "/" +
                  state?.me?.avatar +
                  ".webp"
                }
                width={32}
                height={32}
                style={{ borderRadius: "50%" }}
              />
              <span style={{ marginLeft: "8px" }}>
                {state?.me?.username}
              </span>
            </div>
          </PanelSectionRow>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <PanelSectionRow>
            <VoiceChatChannel />
            <VoiceChatMembers />
          </PanelSectionRow>
        </div>
        <hr></hr>
        <PanelSectionRow>
          <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "12px" }}>
            <p style={{ fontWeight: "bold", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Mission Report</p>
            <UploadScreenshot />
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }
};

export default definePlugin(() => {
  window.DECKCORD = {
    dispatchNotification: (payload: { title: string; body: string }) => {
      console.log("Dispatching Deckcord notification: ", payload);
      toaster.toast(payload);
    },
    MIC_PEER_CONNECTION: undefined,
  };

  let peerConnection: RTCPeerConnection;
  const webrtcEventListener = async (data: any) => {
    if (!data.webrtc) return;
    data = data.webrtc;
    console.log(data);
    if (data.offer) {
      console.log("Deckcord: Starting RTC connection");
      if (peerConnection) peerConnection.close();
      peerConnection = new RTCPeerConnection();
      window.DECKCORD.MIC_PEER_CONNECTION = peerConnection;
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
      });
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log("Deckcord: Sending RTC Answer");
      await call("mic_webrtc_answer", answer);
    } else if (data.ice) {
      try {
        while (peerConnection.remoteDescription == null) await sleep(10);
        await peerConnection.addIceCandidate(data.ice);
      } catch (e) {
        console.error("Deckcord: Error adding received ice candidate", e);
      }
    }
  };
  addEventListener("state", webrtcEventListener);

  let settingsChangeUnregister: any;
  const appLifetimeUnregister =
    SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async () => {
      await sleep(500);
      setPlaying();
    }).unregister;
  const unpatchMenu = patchMenu();

  const setPlaying = () => {
    const app = Router.MainRunningApp;
    call("set_rpc", app !== undefined ? app?.display_name : null);
  };

  let lastDisplayIsExternal = false;
  (async () => {
    await isLoaded();

    settingsChangeUnregister = SteamClient.Settings.RegisterForSettingsChanges(
      async (settings: any) => {
        if (settings.bDisplayIsExternal != lastDisplayIsExternal) {
          lastDisplayIsExternal = settings.bDisplayIsExternal;
          const bounds: any = await call("get_screen_bounds");
          window.DISCORD_TAB.HEIGHT = bounds.height;
          window.DISCORD_TAB.WIDTH = bounds.width;
          window.DISCORD_TAB.m_browserView.SetBounds(
            0,
            0,
            bounds.width,
            bounds.height
          );
        }
      }
    );
    await isLoggedIn();
    setPlaying();
  })();

  routerHook.addRoute("/discord", () => {
    return <DiscordTab />;
  });

  return {
    title: <div className={staticClasses.Title}>TacCord</div>,
    content: <Content />,
    icon: <GiWalkieTalkie />,
    onDismount() {
      unpatchMenu();
      removeEventListener("state", webrtcEventListener);
      try {
        appLifetimeUnregister();
        settingsChangeUnregister();
      } catch (error) { }
    },
    alwaysRender: true,
  };
});
