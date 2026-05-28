import { call, toaster } from "@decky/api";
import { DialogButton, Toggle } from "@decky/ui";
import { useEffect, useRef, useState } from "react";

const PTT_BUTTON_KEY = "DECKCORD_PTT_BUTTON";
const DEFAULT_PTT_BUTTON = 33;

export function PushToTalkButton() {
  const [pttEnabled, setPtt] = useState<boolean>(false);
  const [pttButton, setPttButton] = useState<number>(() =>
    parseInt(localStorage.getItem(PTT_BUTTON_KEY) || String(DEFAULT_PTT_BUTTON))
  );
  const [detecting, setDetecting] = useState<boolean>(false);
  const unregisterPtt = useRef<any>();
  const unregisterDetect = useRef<any>();
  const pttButtonRef = useRef<number>(pttButton);

  useEffect(() => {
    pttButtonRef.current = pttButton;
  }, [pttButton]);

  // Detection mode — listen for next controller button press
  useEffect(() => {
    if (!detecting) {
      unregisterDetect.current?.();
      unregisterDetect.current = undefined;
      return;
    }
    unregisterDetect.current = SteamClient.Input.RegisterForControllerInputMessages(
      (events: any) => {
        for (const event of events) {
          if (event.bS) {
            const code: number = event.nA;
            localStorage.setItem(PTT_BUTTON_KEY, String(code));
            setPttButton(code);
            setDetecting(false);
            toaster.toast({ title: "PTT Button Set", body: `Button code ${code} saved` });
            return;
          }
        }
      }
    ).unregister;
    return () => {
      unregisterDetect.current?.();
    };
  }, [detecting]);

  return (
    <div>
      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        PTT:
        <Toggle
          value={pttEnabled}
          onChange={(checked) => {
            setPtt(checked);
            if (!pttEnabled) {
              call("enable_ptt", true);
              toaster.toast({
                title: "Push-To-Talk",
                body: "Hold down your PTT button to talk",
              });
              unregisterPtt.current =
                SteamClient.Input.RegisterForControllerInputMessages(
                  (events: any) => {
                    for (const event of events)
                      if (event.nA == pttButtonRef.current)
                        call("set_ptt", event.bS);
                  }
                ).unregister;
            } else {
              unregisterPtt.current?.();
              call("enable_ptt", false);
            }
          }}
        />
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
        <span style={{ fontSize: "12px", opacity: 0.6 }}>
          Button: {pttButton}
        </span>
        <DialogButton
          style={{
            padding: "2px 10px",
            minWidth: 0,
            height: "26px",
            fontSize: "11px",
            backgroundColor: detecting ? "#c0392b" : undefined,
          }}
          onClick={() => setDetecting(!detecting)}
        >
          {detecting ? "Cancel" : "Detect"}
        </DialogButton>
      </div>
      {detecting && (
        <div style={{ fontSize: "11px", opacity: 0.55, marginTop: "4px" }}>
          In-game: press any controller button to set it as PTT
        </div>
      )}
    </div>
  );
}
