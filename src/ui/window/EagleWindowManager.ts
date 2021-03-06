import EagleLoggable from "../../../lib/EagleLoggable";
import EagleUtil from "../../../lib/EagleUtil";
import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";
import EagleWindow from "./EagleWindow";
import IEagleWindowContainer from "./IEagleWindowContainer";
import IEagleWindowLayer from "./IEagleWindowLayer";
import ISavedWindowData from "./misc/ISavedWindowData";
import EagleFloatingWindowLayer from "./layers/EagleFloatingWindowLayer";
import IEagleWindowRegistration from "./IEagleWindowRegistration";
import EagleApp from "../../EagleApp";
import { EagleDialogButtonType } from "../../../lib/ui/dialog/button/EagleDialogButtonType";

const SAVE_VERSION = 1;
const SAVE_KEY = "SAVED_WINDOW_PREFS";

interface ISavedData {

    version: number;
    layers: { [id: string]: any }

}

export default class EagleWindowManager extends EagleLoggable {

    constructor(app: EagleApp, floatingWindowContainer: HTMLElement) {
        super("EagleWindowManager");

        //Set
        this.app = app;

        //Create and register floating window layer
        this.floatingWindowLayer = new EagleFloatingWindowLayer(EagleUtil.CreateElement("div", "eagle_window_floating", floatingWindowContainer), this);
        this.RegisterLayer("EagleSDR.Floating", this.floatingWindowLayer);
    }

    private app: EagleApp;
    private registrations: { [classname: string]: IEagleWindowRegistration } = {};
    private layers: { [key: string]: IEagleWindowLayer } = {};
    private activeWindow: EagleWindow;
    private floatingWindowLayer: EagleFloatingWindowLayer;
    private isLoading: boolean = false;

    GetClassnameOfWindow(window: IEagleWindowRegistration) {
        var k = Object.keys(this.registrations);
        for (var i = 0; i < k.length; i++) {
            if (this.registrations[k[i]] == window)
                return k[i];
        }
        throw Error("This window is not registered!");
    }

    CreateWindow(classname: string, settings: any, width: number, height: number, x: number, y: number) {
        //Create the window
        var win = this.InflateWindow(classname, settings);

        //Spawn in floating window
        this.floatingWindowLayer.MakePopoutWindow(win, width, height, x, y);
    }

    CreateWindowDragging(classname: string, settings: any, width: number, height: number, evt: MouseEvent) {
        //Create the window
        var win = this.InflateWindow(classname, settings);

        //Spawn in floating window
        this.floatingWindowLayer.MakePopoutWindow(win, width, height, evt.clientX, evt.clientY);

        //Make mouse move it
        win.MakeMouseDragging();
    }

    CreateWindowClassDragging(window: IEagleWindowRegistration, settings: any, width: number, height: number, evt: MouseEvent) {
        //Create the window
        var win = new EagleWindow(this, window, this.GetClassnameOfWindow(window), settings);

        //Spawn in floating window
        this.floatingWindowLayer.MakePopoutWindow(win, width, height, evt.clientX, evt.clientY);

        //Make mouse move it
        win.MakeMouseDragging();
    }

    //Inflates a window from saved data.
    InflateWindow(classname: string, settings: any): EagleWindow {
        //Find the implementation or make a default
        var impl = this.registrations[classname];
        if (impl == null) {
            this.Warn("Attempted to construct missing window classname: \"" + classname + "\"!");
            impl = new WindowNotFoundFactory(classname);
        }

        //Create
        return new EagleWindow(this, impl, classname, settings);
    }

    //Inflates a window from saved data.
    DeserializeWindow(data: ISavedWindowData): EagleWindow {
        return this.InflateWindow(data.classname, data.settings);
    }

    //Saves everything to disk.
    SaveAll() {
        //If we're loading, ignore
        if (this.isLoading)
            return;

        //Create and apply
        try {
            this.app.storage.SetValue(SAVE_KEY, this.CreateSaveData());
        } catch (error: any) {
            this.app.GetDialogManager().ShowAlertDialog("Can't Save Windows", "There was an internal error saving your current window layout:\n\n" + error, "Okay", EagleDialogButtonType.POSITIVE);
        }
    }

    //Loads everything from disk.
    LoadAll() {
        try {
            //Retrieve
            var data = this.app.storage.GetValue(SAVE_KEY);
            if (data == null)
                return;

            //Set flag
            this.isLoading = true;

            //Load
            this.LoadSaveData(data);
        } catch (error: any) {
            //Log in console
            this.Warn("Failed to deserialize and load saved window data: " + error);

            //Ask the user to clear
            this.app.GetDialogManager().ShowAlertDialog("Can't Restore Windows", "Sorry, there was an error loading your saved window layout. Your windows will reset and the page will reload.", "Clear", EagleDialogButtonType.NEGATIVE).then(() => {
                this.app.storage.DeleteValue(SAVE_KEY);
                window.location.reload();
            });
        }

        //Set flag
        this.isLoading = false;
    }

    //Registers a window class.
    RegisterWindow(classname: string, registration: IEagleWindowRegistration): void {
        //Make sure one doesn't already exist with this name
        if (this.registrations[classname] != null)
            throw Error("A window has already been registered with this classname: " + classname);

        //Add
        this.registrations[classname] = registration;
    }

    //Registers a layer with the system.
    RegisterLayer(name: string, layer: IEagleWindowLayer): void {
        //Make sure one doesn't already exist with this name
        if (this.layers[name] != null)
            throw Error("A layer has already been registered with this name.");

        //Add
        this.layers[name] = layer;
    }

    //Changes the active window to the specified one.
    ChangeActiveWindow(window: EagleWindow) {
        //Deactivate old
        if (this.activeWindow != null) {
            this.activeWindow.WindowDeactivated();
            this.activeWindow = null;
        }

        //Set
        this.activeWindow = window;

        //Activate
        if (this.activeWindow != null) {
            this.activeWindow.WindowActivated();
        }
    }

    //Moves a window into the floating container.
    PopOutWindow(window: EagleWindow, width: number, height: number) {
        //Get the position of the window
        var pos = window.GetBoundingClientRect();

        //Create container
        this.floatingWindowLayer.MakePopoutWindow(window, width, height, pos.left, pos.top);
    }

    private CreateSaveData(): any {
        return {
            "version": SAVE_VERSION,
            "layers": this.CreateLayerSaveData()
        }
    }

    private CreateLayerSaveData(): { [name: string]: any } {
        var d: { [name: string]: any } = {};
        var k = Object.keys(this.layers);
        for (var i = 0; i < k.length; i++)
            d[k[i]] = this.layers[k[i]].Save();
        return d;
    }

    private LoadSaveData(dataRaw: any) {
        var data: ISavedData = dataRaw as ISavedData;
        var k = Object.keys(data.layers);
        for (var i = 0; i < k.length; i++) {
            //Get layer
            var layer = this.layers[k[i]];
            if (layer == null) {
                this.Warn("Attempted to load layer \"" + k[i] + "\", but it wasn't registered!");
                continue;
            }

            //Load
            layer.Load(data.layers[k[i]]);
        }
    }

}

class WindowNotFoundFactory implements IEagleWindowRegistration {

    constructor(classname: string) {
        this.classname = classname;
    }

    private classname: string;

    GetDisplayName(): string {
        return this.classname;
    }

    GetGroupName(): string {
        throw new Error("Method not supported.");
    }

    GetPreview(): HTMLElement {
        throw new Error("Method not supported.");
    }

    Construct(context: IEagleWindowContext): EagleWindowImplementation {
        return new WindowNotFoundImplementation(context);
    }

}

class WindowNotFoundImplementation extends EagleWindowImplementation {

    constructor(window: IEagleWindowContext) {
        super(window);
        this.SetTitle("Window Not Found");
        this.GetMount().classList.add("eagle_window_notfound");
        EagleUtil.CreateElement("div", "eagle_window_notfound_title", this.GetMount()).innerText = "Can't Create Window";
        EagleUtil.CreateElement("div", "eagle_window_notfound_sub", this.GetMount()).innerText = "Sorry, this window couldn't be restored because the plugin that created it was removed or updated.";
    }

    OnOpened(): void {

    }

    OnResized(): void {

    }

    OnClosed(): void {

    }

}