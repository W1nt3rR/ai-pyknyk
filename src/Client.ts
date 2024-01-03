import axios from "axios";

type Agent = "Aki" | "Micko" | "Uki" | "Jocke";

export default class Client {
    static async getMapsData() {
        const response = await axios.get("/maps/");
        return response.data;
    }

    static async calculateSteps(mapName: string, agent: Agent) {
        return await axios.post("/calculate/", {
            map: mapName,
            algorithm: agent,
        });
    }
}
