import EagleLoggable from "../../../lib/EagleLoggable";
import IEaglePluginDemodulator from "../../../lib/plugin/client/IEaglePluginDemodulator";
import IEaglePluginSource from "../../../lib/plugin/client/IEaglePluginSource";
import IEaglePluginSourceOption from "../../../lib/plugin/client/IEaglePluginSourceOption";
import IEaglePluginAsset from "../../../lib/plugin/IEaglePluginAsset";
import EagleApp from "../../EagleApp";
import EaglePluginContext from "./EaglePluginContext";
import EaglePluginRegisteredType from "./EaglePluginRegisteredType";

export default class EaglePluginManager extends EagleLoggable {

    constructor(app: EagleApp) {
        super("EaglePluginManager");
        this.app = app;
        this.initFinishPromise = new Promise((resolve, reject) => {
            this.initFinishFunction = resolve;
        });
    }

    private app: EagleApp;
    private contexts: EaglePluginContext[] = [];
    private initFinishPromise: Promise<void>;
    private initFinishFunction: () => void;

    RegisteredDemodulators: EaglePluginRegisteredType<IEaglePluginDemodulator>[] = [];
    RegisteredSources: EaglePluginRegisteredType<IEaglePluginSource>[] = [];

    async Init() {
        //Create contexts
        for (var i = 0; i < this.app.info.plugins.length; i++) {
            this.contexts.push(new EaglePluginContext(this.app, this, this.app.info.plugins[i]));
        }

        //Download and start all plugins
        for (var i = 0; i < this.contexts.length; i++) {
            //Attempt to get boot asset
            var boot: IEaglePluginAsset;
            try {
                boot = this.contexts[i].GetAsset("boot.js");
            } catch (e) {
                //Has no runtime.
                continue;
            }

            //Log
            this.Log("Downloading and booting plugin \"" + this.contexts[i].GetId() + "\"...");

            //Download
            var bootPayload = await boot.DownloadAsString();

            //Wrap and boot
            try {
                Function('"use strict";return ( function(plugin){ ' + bootPayload + ' } )')()(
                    this.contexts[i]
                );
            } catch (e) {
                this.Error("Uncaught error initializing plugin \"" + this.contexts[i].GetId() + "\" -> " + e);
            }
        }
    }

    async PostInit() {
        //Log
        this.Log("Signaling post-init on plugins...");

        //Signal
        this.initFinishFunction();
    }

    WaitInit(): Promise<void> {
        return this.initFinishPromise;
    }

    // Queries all plugins for sources. Waits for all to complete, but also sends progress events as sources load.
    async QueryPluginSources(progress: (plugin: EaglePluginContext, source: IEaglePluginSource, options: IEaglePluginSourceOption[], sourceIndex: number) => void): Promise<IEaglePluginSourceOption[]> {
        //Start all tasks
        var tasks: Promise<IEaglePluginSourceOption[]>[] = [];
        for (var i = 0; i < this.RegisteredSources.length; i++)
            tasks.push(this.QueryPluginSourcesHelper(this.RegisteredSources[i], i, progress));

        //Wait for all to complete
        var items: IEaglePluginSourceOption[] = [];
        for (var i = 0; i < tasks.length; i++) {
            var result = await tasks[i];
            for (var ii = 0; ii < result.length; ii++)
                items.push(result[ii]);
        }

        return items;
    }

    private async QueryPluginSourcesHelper(data: EaglePluginRegisteredType<IEaglePluginSource>, index: number, progress: (plugin: EaglePluginContext, source: IEaglePluginSource, options: IEaglePluginSourceOption[], sourceIndex: number) => void): Promise<IEaglePluginSourceOption[]> {
        //Start fetching items
        var t = await data.GetItem().QueryOptions();

        //Send progress
        progress(data.GetPlugin(), data.GetItem(), t, index);

        return t;
    }

}