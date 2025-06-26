import Logo from './logo.svg';
import Lock from './lock.svg';
import Mail from './Mail.svg';
import Solid from './Solid.svg';
import Speedometer from './Speedometer.svg';
import Microphone from './microphone.svg';
import VerticalDots from './dots-vertical.svg';
import Frame from './Frame.svg';
import ThumbsDown from './thumbs-down.svg';
import Flag from './Flag.svg';
import Copy from './Copy.svg';
import Refresh from './Refresh.svg';
import Send from './Send.svg';
import Arrow from './Arrow.svg';
import ThumbsUpBold from './thumbs-up-bold.svg';
import ThumbsDownBold from './thumbs-down-bold.svg';
import EyeOff from './eye-off.svg';

import NewChatDark from './dark/Newchat.svg';
import SearchDark from './dark/Search.svg';
import ArrowLeftDark from './dark/ArrowLeft.svg';
import CloseDark from './dark/Close.svg';
import FolderDark from './dark/Folder.svg';
import StarDark from './dark/Star.svg'
import SettingsDark from './dark/Settings.svg'
import FilterDark from './dark/Filter.svg';
import LogoDark from './dark/Logo.svg';
import MenuDark from './dark/Menu.svg';
import ThumbsUpDark from './dark/thumbs-up.svg';

import NewChatLight from './light/NewChat.svg';
import SearchLight from './light/Search.svg';
import ArrowLeftLight from './light/ArrowLeft.svg';
import CloseLight from './light/Close.svg';
import FolderLight from './light/Folder.svg';
import StarLight from './light/Star.svg';
import SettingsLight from './light/Settings.svg';
import FilterLight from './light/Filter.svg';
import LogoLight from './light/Logo.svg';
import MenuLight from './light/Menu.svg';
import ThumbsUpLight from './light/thumbs-up.svg';
import ThumbsDownLight from './light/thumbs-down.svg'; // Add this line

const icons = {
    Logo,
    Lock,
    Mail,
    Solid,
    Speedometer,
    Microphone,
    VerticalDots,
    Frame,
    ThumbsDown,
    Flag,
    Copy,
    Refresh,
    Send,
    Arrow,
    ThumbsUpBold,
    ThumbsDownBold,
    EyeOff,

    // Dark
    NewChatDark,
    SearchDark,
    ArrowLeftDark,
    CloseDark,
    FolderDark,
    StarDark,
    SettingsDark,
    FilterDark,
    LogoDark,
    MenuDark,
    ThumbsUpDark,

    // Light
    NewChatLight,
    SearchLight,
    ArrowLeftLight,
    CloseLight,
    FolderLight,
    StarLight,
    SettingsLight,
    FilterLight,
    LogoLight,
    MenuLight,
    ThumbsUpLight,
    ThumbsDownLight, // Add this line
};

const themedIconMap = {
    Search: {
        dark: SearchDark,
        light: SearchLight,
    },
    NewChat: {
        dark: NewChatDark,
        light: NewChatLight,
    },
    ArrowLeft: {
        dark: ArrowLeftDark,
        light: ArrowLeftLight,
    },
    Close: {
        dark: CloseDark,
        light: CloseLight,
    },
    Folder: {
        dark: FolderDark,
        light: FolderLight,
    },
    Star: {
        dark: StarDark,
        light: StarLight,
    },
    Settings: {
        dark: SettingsDark,
        light: SettingsLight,
    },
    Filter: {
        dark: FilterDark,
        light: FilterLight,
    },
    Logo: {
        dark: LogoDark,
        light: LogoLight,
    },
    Menu: {
        dark: MenuDark,
        light: MenuLight
    },
    ThumbsUp: {
        dark: ThumbsUpDark,
        light: ThumbsUpLight,
    },
    ThumbsDown: {
        dark: ThumbsDown,
        light: ThumbsDownLight, // Uses your new light/thumbs-down.svg
    }
};

export const getThemedIcon = (
    name: keyof typeof themedIconMap,
    theme: 'dark' | 'light'
) => {
    return themedIconMap[name]?.[theme];
};

export default icons;