import { IntroPlayer } from "./intro-player";
import { Logo } from "./logo";

/* First visit only: the logo builds itself (brackets slide in, the horizon
   draws, the sun rises behind it), then flies up into its place in the
   header as the screen clears. The inline head script decides whether it
   plays, before first paint; the build is pure CSS so it starts at once. */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <Logo className="intro-logo" rising />
      <IntroPlayer />
    </div>
  );
}
