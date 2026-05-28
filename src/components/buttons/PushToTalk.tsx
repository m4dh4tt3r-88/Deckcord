import { call, toaster, addEventListener, removeEventListener } from "@decky/api";
import { Toggle } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { DialogButton } from "@decky/ui";

const DEFAULT_PTT_BUTTON = 33;

export function PushToTalkButton() {
  const [pttEnabled, setPtt] = useState<boolean>(false);
  const [pttButton, setPttButton] = useState<number>(DEFAULT_PTT_BUTTON);
  const [detecting, setDetecting] = useState<boolean>(false);
  const unregisterPtt = useRef<any>();
  const pttButtonRef = useRef<number>(pttButton);

  useEffect(() => {
    pttButtonRef.current = pttButton;
  }, [pttButton]);

  // Load current key code from backend on mount
  useEffect(() => {
    call<[], number>("get_ptt_key_code").then((code) => {
      if (code && code !== 0) setPttButton(code);
    });

    // Listen for backend detect completion
    const listener = (code: number) => {
      setPttButton(code);
      setDetecting(false);
      toaster.toast({ title: "PTT Button Set", body: `Key code ${code} saved` });
    };
    addEventListener("ptt_key_detected", listener);
    return () => removeEventListener("ptt_key_detected", listener);
  }, []);

  const toggleDetect = async () => {
    if (detecting) {
      await call("stop_ptt_key_detect");
      setDetecting(false);
    } else {
      await call("start_ptt_key_detect");
      setDetecting(true);
    }
  };

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
          onClick={toggleDetect}
        >
          {detecting ? "Cancel" : "Detect"}
        </DialogButton>
      </div>
      {detecting && (
        <div style={{ fontSize: "11px", opacity: 0.55, marginTop: "4px" }}>
          Press your back button — works in any game
        </div>
      )}
    </div>
  );
}
