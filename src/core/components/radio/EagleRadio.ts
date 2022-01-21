import IEaglePluginSource from "../../../../lib/plugin/client/IEaglePluginSource";
import EagleObject from "../../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../../lib/web/IEagleObjectContext";
import IEaglePortApi from "../../../../lib/web/ports/IEaglePortApi";
import IEaglePortProperty from "../../../../lib/web/ports/IEaglePortProperty";
import EagleRadioSession from "./EagleRadioSession";

export default class EagleRadio extends EagleObject {

    constructor(net: IEagleObjectContext) {
        super("EagleRadio", net);

        //Register types
        this.RegisterClass("EagleWeb.Core.Radio.Session.EagleRadioSession", EagleRadioSession);
    }

    private PortCreateSession: IEaglePortApi;

    PortIsEnabled: IEaglePortProperty<boolean>;
    PortSource: IEaglePortProperty<EagleObject>;

    async CreateSession(): Promise<EagleRadioSession> {
        var data = await this.PortCreateSession.SendRequest({});
        return this.ResolveNetObject<EagleRadioSession>(data["guid"] as string);
    }
 
}