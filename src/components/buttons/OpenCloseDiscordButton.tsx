import { DialogButton, Router } from "@decky/ui";
import { GiWalkieTalkie } from "react-icons/gi";

export function OpenDiscordButton() {
  return (
    <DialogButton onClick={() => Router.Navigate("/discord")} style={{ width: "100%" }}>
      <GiWalkieTalkie style={{ marginRight: "6px" }} />
      Open TacCord
    </DialogButton>
  );
}
