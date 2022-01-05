import EagleLoggable from "../../../lib/EagleLoggable";
import IEaglePluginAsset from "../../../lib/plugin/IEaglePluginAsset";
import EagleApp from "../../EagleApp";
import EaglePluginContext from "./EaglePluginContext";

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

}