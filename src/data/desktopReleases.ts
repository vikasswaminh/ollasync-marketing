// Releases of OllaSync for Windows, newest first: the /download page is built from this list.
// The files are served at /desktop/<file> from the release bucket (public/_worker.js), which only answers for
// names of this shape. Upload a release first, then add its entry here: the first entry is the one the page offers.
export type DesktopFile = { file: string; bytes: number; sha256: string };
export type DesktopRelease = {
  version: string;
  /** ISO date of the release */
  date: string;
  installer: DesktopFile;
  portable: DesktopFile;
  changes: string[];
};

/** The name Windows shows as the publisher of the signed installer. */
export const DESKTOP_PUBLISHER = 'VICTOR CHASEX PRIVATE LIMITED';
/** The name the app carries in the Start menu and in Windows' list of installed apps. */
export const DESKTOP_APP_NAME = 'Ollasync Studio';

export const DESKTOP_RELEASES: DesktopRelease[] = [
  {
    version: '0.9.3',
    date: '2026-11-25',
    installer: {
      file: 'OllasyncStudio-Setup-0.9.3.exe',
      bytes: 121217112,
      sha256: '7b61b57c2d7938ec0f931dd3b95a826c0daf6e8d3f9a23dcb0f8ca927628360c',
    },
    portable: {
      file: 'OllasyncStudio-0.9.3-portable.exe',
      bytes: 110334792,
      sha256: 'd29bcb272b5ea0378716cb178174c98e446cb78aef3b8f37385777312f297b5a',
    },
    changes: [
      'Screen sharing with annotation: draw on your shared screen while your toolbar and the floating meeting window stay out of the picture.',
      'The installed app now updates itself: it downloads a new version in the background and installs it when you close the app.',
      'Fixed: a recording could stop while the app window was covered by another window.',
      'Fixed: the window grew by a few pixels on every restart at 125% display scaling.',
      'Fixed: closing the app right after signing in could lose the sign-in.',
      'Save dialogs are named clearly, and a cancelled save leaves no temporary file behind.',
      'After a crash, the recovery page says what happened instead of blaming the network.',
      'Uninstalling removes the app’s local data as well.',
      'The portable version keeps its data in a folder next to the file.',
      'The installer and Windows’ list of installed apps show the publisher.',
    ],
  },
];
