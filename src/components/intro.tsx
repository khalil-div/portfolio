import { IntroPlayer } from "./intro-player";
import { Logo } from "./logo";

/* First visit only: the k writes itself and its full stop rises into place
   like the sun, then the tile forms around it as it flies up into its place
   in the header and the screen clears. The inline head script decides whether it
   plays, before first paint; the build is pure CSS so it starts at once. */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <Logo className="intro-logo" />
      <IntroPlayer />
    </div>
  );
}
