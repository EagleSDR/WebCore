import IEagleFileManager from "../lib/core/files/IEagleFileManager";
import IEagleContext from "../lib/core/IEagleContext";
import EagleLoggable from "../lib/EagleLoggable";
import EagleUtil from "../lib/EagleUtil";
import IEagleDialogBuilder from "../lib/ui/dialog/IEagleDialogBuilder";
import IEagleObjectConstructor from "../lib/web/IEagleObjectConstructor";
import IEagleObjectContext from "../lib/web/IEagleObjectContext";
import EagleControl from "./core/components/control/EagleControl";
import EagleControlComponents from "./core/components/control/EagleControlComponents";
import EagleWebFileManager from "./core/components/EagleWebFileManager";
import EagleRadio from "./core/components/radio/EagleRadio";
import EaglePluginManager from "./core/plugin/EaglePluginManager";
import EagleDialogBuilder from "./ui/dialog/builder/EagleDialogBuilder";
import EagleDialogManager from "./ui/dialog/EagleDialogManager";
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
        this.net = new EagleNetObjectManager(this, this.CreateUrl(true, "/ws/rpc", {
            "access_token": this.GetAccessToken()
        }));
        this.plugins = new EaglePluginManager(this);

        //Create UI components
        this.dialogManager = new EagleDialogManager(mount);
        this.windowManager = new EagleWindowManager(mount);
        this.windowBar = new EagleWindowFactoryBar(EagleUtil.CreateElement("div", null, mount), this.windowManager);

        //TEST
        RegisterTestWindows(this.windowManager);
        var t = EagleUtil.CreateElement("div", "LAYER_TEST", mount);
        t.style.backgroundColor = "#0a0b0c";
        t.style.position = "fixed";
        t.style.top = "0";
        t.style.bottom = "0";
        t.style.right = "0";
        t.style.left = "180px";
        var c = new EagleDockWindowLayer(t, this.windowManager);
        this.windowManager.RegisterLayer("test", c);

        //Register core components
        this.RegisterClass("EagleWeb.Core.Web.EagleControlObject", EagleControl);
        this.RegisterClass("EagleWeb.Core.Radio.EagleRadio", EagleRadio);
        this.RegisterClass("EagleWeb.Core.Web.FileSystem.WebFsManager", EagleWebFileManager);
    }

    mount: HTMLElement;
    netRoot: string;
    net: EagleNetObjectManager;
    plugins: EaglePluginManager;

    dialogManager: EagleDialogManager;
    windowManager: EagleWindowManager;
    windowBar: EagleWindowFactoryBar;

    info: EagleEndpointInfo;
    control: EagleControl;
    components: EagleControlComponents;
    pluginModules: { [pluginId: string]: { [classname: string]: string } };

    GetAccessToken(): string {
        return "90VuwPtqv135S1TwjDVvehU4Dy94XO7T"; //TODO
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
        //Request info
        this.info = await EagleUtil.HttpGetRequestJson(this.CreateUrl(false, "/api/info", {})) as EagleEndpointInfo;

        //Load plugins
        await this.plugins.Init();

        //Connect to WebSocket and get objects
        this.control = await this.net.Connect() as EagleControl;
        this.components = await this.control.GetComponents();
        this.pluginModules = await this.control.GetPluginModules();

        //Initialize plugins
        await this.plugins.PostInit();

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

    GetFileManager(): IEagleFileManager {
        return this.components.GetFileManager();
    }

    CreateDialogBuilder(): IEagleDialogBuilder {
        return new EagleDialogBuilder(this.dialogManager);
    }

}