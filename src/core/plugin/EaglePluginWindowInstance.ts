import IEaglePluginWindowInstance from "../../../lib/plugin/IEaglePluginWindowInstance";
import IEagleWindowFactoryItem from "../../ui/window/factory/IEagleWindowFactoryItem";
import IEagleWindowRegistration from "../../ui/window/IEagleWindowRegistration";

export default class EaglePluginWindowInstance implements IEagleWindowFactoryItem {

    constructor(data: IEaglePluginWindowInstance, registration: IEagleWindowRegistration) {
        this.data = data;
        this.registration = registration;
    }

    private data: IEaglePluginWindowInstance;
    private registration: IEagleWindowRegistration;

    GetInstance(): IEaglePluginWindowInstance {
        return this.data;
    }

    GetDisplayName(): string {
        return this.data.GetDisplayName();
    }

    GetGroupName(): string {
        return this.data.GetGroupName();
    }

    GetPreview(canvas: CanvasRenderingContext2D, width: number, height: number): void {
        return this.data.GetPreview(canvas, width, height);
    }

    GetSettings() {
        return this.data.GetSettings();
    }

    GetRegistration(): IEagleWindowRegistration {
        return this.registration;
    }

}