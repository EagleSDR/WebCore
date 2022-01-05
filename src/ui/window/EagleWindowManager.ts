import EagleUtil from "../../../lib/EagleUtil";
import EagleWindow from "./EagleWindow";
import IEagleWindowContainer from "./IEagleWindowContainer";
import IEagleWindowLayer from "./IEagleWindowLayer";
import EagleFloatingWindowLayer from "./layers/EagleFloatingWindowLayer";

export default class EagleWindowManager {

    constructor(floatingWindowMount: HTMLElement) {
        this.floatingWindowLayer = new EagleFloatingWindowLayer(this.CreateLayer(floatingWindowMount, "EagleSDR.Floating"));
    }

    private layers: EagleLayerImpl[] = [];
    private activeWindow: EagleWindow;
    private floatingWindowLayer: EagleFloatingWindowLayer;

    CreateLayer(mount: HTMLElement, name: string): IEagleWindowLayer {
        //Make sure one doesn't already exist with this name
        if (this.FindLayerByName(name) != null)
            throw Error("A layer has already been created with this name.");

        //Create
        var layer = new EagleLayerImpl(mount, name, this);
        this.layers.push(layer);

        return layer;
    }

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

    PopOutWindow(window: EagleWindow, width: number, height: number) {
        //Get the position of the window
        var pos = window.GetBoundingClientRect();

        //Create container
        this.floatingWindowLayer.MakePopoutWindow(window, width, height, pos.left, pos.top);
    }

    private FindLayerByName(name: string): EagleLayerImpl {
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].GetName() == name)
                return this.layers[i];
        }
        return null;
    }

}

class EagleLayerImpl implements IEagleWindowLayer {

    constructor(container: HTMLElement, name: string, windowManager: EagleWindowManager) {
        this.container = container;
        this.name = name;
        this.windowManager = windowManager;
    }

    private container: HTMLElement;
    private name: string;
    private windowManager: EagleWindowManager;

    GetMount(): HTMLElement {
        return this.container;
    }

    GetWindowManager(): EagleWindowManager {
        return this.windowManager;
    }

    GetName(): string {
        return this.name;
    }

    Save(data: any): void {
        throw new Error("Method not implemented.");
    }

    Load() {
        throw new Error("Method not implemented.");
    }

}