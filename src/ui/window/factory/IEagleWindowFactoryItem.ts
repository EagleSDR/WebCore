import IEagleWindowRegistration from "../IEagleWindowRegistration";

//Represents an item in the list of widgets
export default interface IEagleWindowFactoryItem {

    // The name shown in the picker.
    GetDisplayName(): string;

    // Defines the name of the group. Items with the same group name are automatically grouped.
    GetGroupName(): string;

    // Generates a preview element. The user is expected to draw to this canvas.
    GetPreview(canvas: CanvasRenderingContext2D, width: number, height: number): void;

    // Gets the default settings to create the window with.
    GetSettings(): any;

    // Gets the associated registration.
    GetRegistration(): IEagleWindowRegistration;

}