import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindowImplementation from "../../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowContext from "../../../../lib/ui/window/IEagleWindowContext";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowRegistration from "../IEagleWindowRegistration";

export function RegisterTestWindows(manager: EagleWindowManager) {
    manager.RegisterWindow("Test.BLUE", new TestWindowRegistration("Blue", "#0563a4"));
    manager.RegisterWindow("Test.PURPLE", new TestWindowRegistration("Purple", "#a558e8"));
    manager.RegisterWindow("Test.GREEN", new TestWindowRegistration("Green", "#71e93f"));
    manager.RegisterWindow("Test.PINK", new TestWindowRegistration("Pink", "#ea387f"));
}

class TestWindow extends EagleWindowImplementation {
    
    constructor(window: IEagleWindowContext, colorName: string, colorValue: string) {
        super(window);
        this.SetTitle(colorName + " Window");
        this.GetMount().style.backgroundColor = colorValue;
    }

    OnOpened(): void {
        
    }

    OnResized(): void {
        
    }

    OnClosed(): void {
        
    }

}

class TestWindowRegistration implements IEagleWindowRegistration {

    constructor(colorName: string, colorValue: string) {
        this.colorName = colorName;
        this.colorValue = colorValue;
    }

    private colorName: string;
    private colorValue: string;

    GetDisplayName(): string {
        return "Test " + this.colorName;
    }

    GetGroupName(): string {
        return null;
    }

    GetPreview(): HTMLElement {
        var e = EagleUtil.CreateElement("div", null);
        e.style.backgroundColor = this.colorValue;
        return e;
    }

    Construct(context: IEagleWindowContext): EagleWindowImplementation {
        return new TestWindow(context, this.colorName, this.colorValue);
    }

}