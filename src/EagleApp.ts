import IEagleFileManager from "../lib/core/files/IEagleFileManager";
import IEagleContext from "../lib/core/IEagleContext";
import IEagleRadio from "../lib/core/radio/IEagleRadio";
import EagleLoggable from "../lib/EagleLoggable";
import EagleUtil from "../lib/EagleUtil";
import { EagleDialogButtonType } from "../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../lib/ui/dialog/IEagleDialog";
import IEagleDialogBuilder from "../lib/ui/dialog/IEagleDialogBuilder";
import IEagleDialogManager from "../lib/ui/dialog/IEagleDialogManager";
import IEagleObjectConstructor from "../lib/web/IEagleObjectConstructor";
import IEagleObjectContext from "../lib/web/IEagleObjectContext";
import EagleAudioManager from "./core/components/audio/EagleAudioManager";
import EagleControl from "./core/components/control/EagleControl";
import EagleControlComponents from "./core/components/control/EagleControlComponents";
import EagleWebFileManager from "./core/components/EagleWebFileManager";
import EagleRadio from "./core/components/radio/EagleRadio";
import EagleRadioSession from "./core/components/radio/EagleRadioSession";
import EagleKeyValuePersistentStorage from "./core/misc/EagleKeyValuePersistentStorage";
import EaglePluginManager from "./core/plugin/EaglePluginManager";
import EagleCoreInterface from "./ui/core/EagleCoreInterface";
import EagleDialogBuilder from "./ui/dialog/builder/EagleDialogBuilder";
import EagleDialogManager from "./ui/dialog/EagleDialogManager";
import PromptLoginDialog from "./ui/login/EagleLoginDialog";
import EagleWindow from "./ui/window/EagleWindow";
import EagleWindowManager from "./ui/window/EagleWindowManager";
import EagleWindowFactoryBar from "./ui/window/factory/EagleWindowFactoryBar";
import EagleDockWindowLayer from "./ui/window/layers/EagleDockWindowLayer";
import { RegisterTestWindows } from "./ui/window/misc/TestWindows";
import EagleManagedSocket from "./web/EagleManagedSocket";
import EagleNetObjectManager from "./web/EagleNetObjectManager";
import EagleEndpointInfo from "./web/endpoints/info/EagleEndpointInfo";

export default class EagleApp extends EagleLoggable implements IEagleContext {

    constructor(mount: HTMLElement, netRoot: string) {
        super("EagleApp");
        this.mount = mount;
        this.netRoot = netRoot;

        //Create components
        this.storage = new EagleKeyValuePersistentStorage("eaglesdr");
        this.net = new EagleNetObjectManager(this);
        this.audio = new EagleAudioManager(this);
        this.plugins = new EaglePluginManager(this);

        //Create UI components
        this.dialogManager = new EagleDialogManager(mount);
        this.windowManager = new EagleWindowManager(this, mount);
        this.coreUi = new EagleCoreInterface(this, this.mount);

        //Register core components
        this.RegisterClass("EagleWeb.Core.Web.EagleControlObject", EagleControl);
        this.RegisterClass("EagleWeb.Core.Radio.EagleRadio", EagleRadio);
        this.RegisterClass("EagleWeb.Core.Radio.EagleRadioSession", EagleRadioSession);
        this.RegisterClass("EagleWeb.Core.Web.FileSystem.WebFsManager", EagleWebFileManager);
    }

    mount: HTMLElement;
    netRoot: string;

    storage: EagleKeyValuePersistentStorage;
    net: EagleNetObjectManager;
    audio: EagleAudioManager;
    plugins: EaglePluginManager;

    dialogManager: EagleDialogManager;
    windowManager: EagleWindowManager;
    coreUi: EagleCoreInterface;

    info: EagleEndpointInfo;
    control: EagleControl;
    components: EagleControlComponents;
    pluginModules: { [pluginId: string]: { [classname: string]: string } };

    GetAccessToken(): string {
        return this.storage.GetValue<string>("ACCESS_TOKEN");
    }

    SetAccessToken(token: string) {
        this.storage.SetValue("ACCESS_TOKEN", token);
    }

    private IsSsl(): boolean {
        switch (document.location.protocol) {
            case "http:": return false;
            case "file:": return false;
            case "https:": return true;
        }
        this.Warn("IsSsl: Unknown protocol. Assuming no SSL...");
        return false;
    }

    CreateUrl(isWebsocket: boolean, path: string, query: {[key: string]: string}) {
        var result = (isWebsocket ? "ws" : "http") + (this.IsSsl() ? "s" : "") + "://" + document.location.host + this.netRoot + path;
        var keys = Object.keys(query);
        for (var i = 0; i < keys.length; i++)
            result += (i == 0 ? "?" : "&") + encodeURIComponent(keys[i]) + "=" + encodeURIComponent(query[keys[i]]);
        return result;
    }

    async Init() {
        try {
            await this.InternalInit();
        } catch (error: any) {
            this.dialogManager.ShowFatalErrorDialog(
                "Fatal Error Initializing",
                "There was a fatal error initializing the client. This is likely a bug. Try clearing your browser's local storage.\n\n" + error
            );
            throw error;
        }
    }

    private async InternalInit() {
        //Request info
        this.info = await EagleUtil.HttpGetRequestJson(this.CreateUrl(false, "/api/info", {})) as EagleEndpointInfo;

        //Show login screen if needed
        if (this.GetAccessToken() == null)
            this.SetAccessToken(await PromptLoginDialog(this, this.mount));

        //Load plugins
        await this.plugins.Init();

        //Connect to WebSocket and get objects
        this.control = await this.net.Connect(this.CreateUrl(true, "/ws/rpc", {
            "access_token": this.GetAccessToken()
        })) as EagleControl;
        this.components = await this.control.GetComponents();
        this.pluginModules = await this.control.GetPluginModules();

        //Initialize the radio
        await this.GetRadio().Init();

        //Initialize plugins
        await this.plugins.PostInit();

        //Initialize core UI
        await this.coreUi.Initialize();

        //Restore windows
        this.windowManager.LoadAll();
    }

    RegisterClass(classname: string, constructor: IEagleObjectConstructor) {
        return this.net.RegisterClass(classname, constructor);
    }

    CreateManagedSocketById(id: string): EagleManagedSocket {
        return new EagleManagedSocket(this, id);
    }

    CreateManagedSocketByName(name: string): EagleManagedSocket {
        var id = this.info.sockets[name];
        if (id == null)
            throw Error("No socket exists with the name \"" + name + "\".");
        return this.CreateManagedSocketById(id);
    }

    GetWindowFactory(): EagleWindowFactoryBar {
        return this.coreUi.customize;
    }

    /* API */

    GetFileManager(): IEagleFileManager {
        return this.components.GetFileManager();
    }

    GetDialogManager(): IEagleDialogManager {
        return this.dialogManager;
    }

    GetRadio(): EagleRadio {
        return this.components.GetRadio();
    }

}