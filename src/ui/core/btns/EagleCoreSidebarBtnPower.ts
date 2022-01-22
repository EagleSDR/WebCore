import IEaglePluginSource from "../../../../lib/plugin/client/IEaglePluginSource";
import IEaglePluginSourceOption from "../../../../lib/plugin/client/IEaglePluginSourceOption";
import { EagleDialogButtonType } from "../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogList from "../../../../lib/ui/dialog/list/IEagleDialogList";
import IEaglePortProperty from "../../../../lib/web/ports/IEaglePortProperty";
import EaglePluginContext from "../../../core/plugin/EaglePluginContext";
import EagleApp from "../../../EagleApp";
import EagleCoreSidebarBtn from "../sidebar/EagleCoreSidebarBtn";
require('./btns.css');

const CLASSNAME_PLAY = "eagle_core_btns_power_play";
const CLASSNAME_PAUSE = "eagle_core_btns_power_pause";

export default class EagleCoreSidebarBtnPower extends EagleCoreSidebarBtn {

    constructor(app: EagleApp) {
        super(CLASSNAME_PLAY);
        this.app = app;
        this.GetPowerPort().OnUpdated.Bind({
            HandleEvent: () => {
                this.Refresh();
            }
        });
    }

    private app: EagleApp;

    private GetPowerPort(): IEaglePortProperty<boolean> {
        return this.app.components.GetRadio().PortIsEnabled;
    }

    private Refresh() {
        if (this.GetPowerPort().GetValue())
            this.ChangeCustomClassname(CLASSNAME_PAUSE);
        else
            this.ChangeCustomClassname(CLASSNAME_PLAY);
    }

    protected HandleClick(): Promise<void> {
        if (this.GetPowerPort().GetValue())
            return this.StopRadio();
        else
            return this.StartRadio();
    }

    private async StartRadio(): Promise<void> {
        //Prompt the user for the source to use
        var source = await this.PromptSelectSource();
        if (source == null)
            return;

        //Get the item
        var sourceImpl = await source.Choose();
        if (sourceImpl == null)
            return;

        //Set the source
        await this.app.components.GetRadio().PortSource.SetValue(sourceImpl);

        //Start the radio
        await this.app.components.GetRadio().PortIsEnabled.SetValue(true);
    }

    private async StopRadio(): Promise<void> {
        //Stop the radio
        await this.app.components.GetRadio().PortIsEnabled.SetValue(false);

        //Set the source...(should we do some cleanup here?)
        await this.app.components.GetRadio().PortSource.SetValue(null);
    }

    private PromptSelectSource(): Promise<IEaglePluginSourceOption> {
        return new Promise<IEaglePluginSourceOption>((resolve) => {
            //Create the dialog
            var e = this.app.GetDialogManager().CreateDialogBuilder();
            var dialog: IEagleDialog;
            var list: IEagleDialogList;
            var startBtn = e.AddButton("Start", EagleDialogButtonType.POSITIVE, () => {
                resolve(list.GetSelectedValue());
                dialog.Remove();
            });
            e.AddButton("Cancel", EagleDialogButtonType.NEUTRAL, () => {
                resolve(null);
                dialog.Remove();
            });
            e.AddTitle("Choose Radio Source");
            startBtn.Disable();

            //Start creating the list
            list = e.AddList();
            list.StartLoadingTimeout(5000);
            list.OnSelectionChanged.Bind({
                HandleEvent(data: any) {
                    if (data == null)
                        startBtn.Disable();
                    else
                        startBtn.Enable();
                }
            })

            //Show
            dialog = e.Show();

            //Gather items asynchronously
            this.app.plugins.QueryPluginSources((plugin: EaglePluginContext, source: IEaglePluginSource, options: IEaglePluginSourceOption[], sourceIndex: number): void => {
                //Loaded a group of options
                for (var i = 0; i < options.length; i++)
                    list.AddItemAsset(
                        (sourceIndex * 1000) + i,
                        options[i].GetDisplayName(),
                        options[i].GetDisplaySubtext(),
                        options[i].GetDisplayIcon(),
                        options[i]
                    );
            }).then(() => {
                //Finished loading
                list.StopLoading();
            });
        });
    }

}