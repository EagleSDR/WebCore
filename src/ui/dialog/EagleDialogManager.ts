import EagleUtil from "../../../lib/EagleUtil";
import { EagleDialogButtonType } from "../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogBuilder from "../../../lib/ui/dialog/IEagleDialogBuilder";
import IEagleDialogManager from "../../../lib/ui/dialog/IEagleDialogManager";
import EagleDialogBuilder from "./builder/EagleDialogBuilder";
import EagleDialogBox from "./EagleDialogBox";
require("./dialog_main.css");

const ANIMATION_TIME: number = 110;

export default class EagleDialogManager implements IEagleDialogManager {

    constructor(container: HTMLElement) {
        this.root = EagleUtil.CreateElement("div", "eagle_dialog_root", container);
        this.content = EagleUtil.CreateElement("div", "eagle_dialog_content", this.root);
    }

    private root: HTMLElement;
    private content: HTMLElement;
    private current: DialogBoxImpl;
    private stack: DialogBoxImpl[] = [];
    private isUpdating: boolean = false;
    private updateWaiting: boolean = false;

    /* PUBLIC API */

    CreateDialogBuilder(): IEagleDialogBuilder {
        return new EagleDialogBuilder(this);
    }

    ShowYesNoDialog(title: string, msg: string, yesText: string, yesType: EagleDialogButtonType, noText: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            var builder = this.CreateDialogBuilder();
            var dialog: IEagleDialog;
            builder.AddTitle(title);
            builder.AddParagraph(msg);
            builder.AddButton(yesText, yesType, () => {
                resolve(true);
                dialog.Remove();
            });
            builder.AddButton(noText, EagleDialogButtonType.NEUTRAL, () => {
                resolve(false);
                dialog.Remove();
            });
            dialog = builder.Show();
        });
    }

    ShowAlertDialog(title: string, msg: string, btnText: string, btnType: EagleDialogButtonType, btnAction?: () => Promise<void>): Promise<void> {
        return new Promise<void>((resolve) => {
            var builder = this.CreateDialogBuilder();
            var dialog: IEagleDialog;
            builder.AddTitle(title);
            builder.AddParagraph(msg);
            var btn = builder.AddButton(btnText, btnType, () => {
                if (btnAction != null) {
                    btn.SetLoading(true);
                    btnAction().then(() => {
                        resolve();
                        dialog.Remove();
                    });
                } else {
                    resolve();
                    dialog.Remove();
                }
            });
            dialog = builder.Show();
        });
    }

    // Shows a dialog that requests the user to reload the app
    ShowFatalErrorDialog(title: string, msg: string): Promise<void> {
        return this.ShowAlertDialog(
            title, msg,
            "Reload",
            EagleDialogButtonType.NEGATIVE,
            () => {
                return new Promise<void>((resolve) => {
                    window.location.reload();
                });
            }
        );
    }

    /* PRIVATE API */

    // Creates a new dialog box but does not show it.
    CreateDialog(): EagleDialogBox {
        return new DialogBoxImpl(
            (dialog: DialogBoxImpl) => {
                //Remove from stack if it's already in it
                this.RemoveFromStack(dialog);

                //Push to the stack
                this.stack.push(dialog);

                //Trigger refresh
                this.SafeUpdate();
            },
            (dialog: DialogBoxImpl, remove: boolean) => {
                //Remove from stack if it's already in it
                if (!this.RemoveFromStack(dialog))
                    return;

                //Trigger refresh
                this.SafeUpdate();
            }
        );
    }

    // Gets the topmost stack item
    private GetTopElement(): DialogBoxImpl {
        if (this.stack.length == 0)
            return null;
        return this.stack[this.stack.length - 1];
    }

    // Simply removes the dialog from the stack. Does not make any other changes and does not call a refresh. Returns true if it was removed, otherwise false
    private RemoveFromStack(dialog: DialogBoxImpl): boolean {
        var index = this.stack.indexOf(dialog);
        if (index == -1)
            return false;
        this.stack.splice(index, 1);
        return true;
    }

    // Schedules a refresh to happen soon.
    private SafeUpdate() {
        //If we're already in progress, abort
        if (this.isUpdating) {
            this.updateWaiting = true;
            return;
        }

        //Set state
        this.isUpdating = true;
        this.updateWaiting = false;

        //Add updating class
        this.root.classList.add("eagle_dialog_root_updating");

        //Bit of a hack...wait for the next frame and do it. We do this to allow additional changes immediately after
        window.requestAnimationFrame(() => {
            //Update
            this._UnsafeUpdateAsync().then(() => {
                //Set state
                this.isUpdating = false;

                //Clear updating class
                this.root.classList.remove("eagle_dialog_root_updating");

                //Do it again if needed
                if (this.updateWaiting)
                    this.SafeUpdate();
            });
        });
    }

    // Performs an update. UNSAFE. RUNNING MULTIPLE AT A TIME WILL BREAK.
    private async _UnsafeUpdateAsync() {
        //Check state
        if (this.stack.length == 0) {
            //Nothing should be showing...
            if (this.current != null) {
                //Remove the current item
                await this._HideCurrentAsync(true);
            }
        } else {
            //Something should be showing...
            var next = this.GetTopElement();
            if (this.current == next) {
                //Already in a correct state.
                return;
            }

            //Check if we need to hide the current view first
            if (this.current != null) {
                //Showing the wrong view. Hide the current view first...
                await this._HideCurrentAsync(false);
            }

            //Set the correct view
            this.current = next;
            this.content.appendChild(this.current.GetRootNode());

            //Set active
            this.content.classList.add("eagle_dialog_content_active");
            this.root.classList.add("eagle_dialog_root_active");

            //Wait out the animation
            await EagleDialogManager.DelayAsync(ANIMATION_TIME);
        }
    }

    private async _HideCurrentAsync(hideRoot: boolean) {
        //Set state
        this.current = null;

        //Make the content inactive and wait out the animation
        this.content.classList.remove("eagle_dialog_content_active");
        if (hideRoot)
            this.root.classList.remove("eagle_dialog_root_active");
        await EagleDialogManager.DelayAsync(ANIMATION_TIME);

        //Remove content children
        EagleUtil.RemoveElementChildren(this.content);
    }

    private static DelayAsync(delay: number): Promise<void> {
        return new Promise<void>((resolve) => {
            window.setTimeout(() => resolve(), delay);
        });
    }
}

class DialogBoxImpl extends EagleDialogBox {

    constructor(showCallback: (dialog: DialogBoxImpl) => void, hideCallback: (dialog: DialogBoxImpl, remove: boolean) => void) {
        super();
        this.showCallback = showCallback;
        this.hideCallback = hideCallback;
    }

    private showCallback: (dialog: DialogBoxImpl) => void;
    private hideCallback: (dialog: DialogBoxImpl, remove: boolean) => void;

    GetRootNode(): HTMLElement {
        return this.node;
    }

    Show(): void {
        this.showCallback(this);
    }

    Hide(): void {
        this.hideCallback(this, false);
    }

    Remove(): void {
        this.hideCallback(this, true);
    }

}