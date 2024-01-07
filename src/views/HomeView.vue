<template>
    <div class="full-screen-loader" v-if="loading">
        <span class="loader"></span>
    </div>

    <div id="home">
        <div
            class="map"
            ref="mapRef"
        >
            <img :src="Terrain" />

            <div class="map-overlay">
                <div class="header">
                    <div
                        class="agent-selector"
                        v-for="agent in agents"
                        :key="agent.name"
                    >
                        <img
                            @click="setAgent(agent)"
                            :src="agent.icon"
                        />
                        <p>{{ agent.name }}</p>
                    </div>
                </div>
                <div class="footer">
                    <div class="map-selector" v-for="map in mapsData" :key="map.map_name">
                        <img
                            @click="selectMap(map)"
                            :src="Map"
                        />
                        <p>{{ map.map_name }}</p>
                    </div>
                </div>
            </div>

            <div
                class="coin"
                v-for="(coin, index) in selectedMap?.coins"
                :key="`coin-${index}`"
                :style="{
                    left: scaleCoinX(coin.x) + 'px',
                    top: scaleCoinY(coin.y) + 'px',
                }"
            >
                <img :src="Coin" />
                <span>{{ index }}</span>
            </div>

            <div
                class="agent"
                :style="{
                    left: scaleCoinX(agentPosition.x) + 'px',
                    top: scaleCoinY(agentPosition.y) + 'px',
                }"
            >
                <img :src="selectedAgent.icon" />
            </div>
        </div>
        <div class="steps-container">
            <div class="steps">
                <div
                    class="step"
                    v-for="num in currentStep"
                    :key="`step-${num}`"
                >
                    <span>Step: {{ steps?.[num].step }}</span>
                    <span>{{ steps?.[num].from_node }} -> {{ steps?.[num].to_node }}</span>
                    <span>{{ steps?.[num].cost }}</span>
                </div>
            </div>
            <div class="costs">
                <span>Current cost: {{ currentCost }}</span>
                <span>Final cost: {{ finalCost }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref, computed } from "vue";
    import Client, { type Agent, type IPoint, type IStep, type MapData } from "@/Client";

    import Terrain from "@/assets/maps/terrain_upscaled.png";
    import Map from "@/assets/maps/terrain.png";
    import Coin from "@/assets/icons/coin.png";

    import Aki from "@/assets/icons/Aki.png";
    import Uki from "@/assets/icons/Uki.png";
    import Jocke from "@/assets/icons/Jocke.png";
    import Micko from "@/assets/icons/Micko.png";

    interface AgentInfo {
        name: Agent;
        icon: string;
    }

    const agents = ref<Array<AgentInfo>>([
        { name: "Aki", icon: Aki },
        { name: "Uki", icon: Uki },
        { name: "Jocke", icon: Jocke },
        { name: "Micko", icon: Micko },
    ]);

    const loading = ref<boolean>(false);
    const mapsData = ref<Array<MapData> | null>(null);
    const selectedMap = ref<MapData | null>(null);
    const selectedAgent = ref<AgentInfo>(agents.value[0]);
    const agentPosition = ref<IPoint>({ x: 0, y: 0 });
    const agentMoving = ref<boolean>(false);

    const currentStep = ref<number>(0);
    const currentNode = ref<number>(0);
    const steps = ref<Array<IStep> | null>(null);

    const mapRef = ref<HTMLElement | null>(null);

    const finalCost = computed(() => {
        if (!steps.value) return 0;

        return steps.value.reduce((acc, step) => acc + step.cost, 0);
    });

    const currentCost = computed(() => {
        if (!steps.value) return 0;

        return steps.value.slice(0, currentStep.value + 1).reduce((acc, step) => acc + step.cost, 0);
    });

    function scaleCoinX(x: number) {
        if (!mapRef.value) return 0;
        return (x / 1000) * mapRef.value.clientWidth;
    }

    function scaleCoinY(y: number) {
        if (!mapRef.value) return 0;
        return (y / 600) * mapRef.value.clientHeight;
    }

    function setAgent(agent: AgentInfo) {
        if (selectedAgent.value === agent) return;
        
        selectedAgent.value = agent;
        calculateSteps();
    }

    async function setupMaps() {
        loading.value = true;

        try {
            const maps = await Client.getMapsData();
            mapsData.value = maps;

            // Set initial map
            if (!selectedMap.value) {
                selectMap(maps[0]);
                await calculateSteps();
            }
        } catch (error) {
            console.log(error);
        }

        loading.value = false;
    }

    function selectMap(map: MapData) {
        if (selectedMap.value === map) return;

        selectedMap.value = map;
        calculateSteps();
    }

    function setAgentPosition(point: IPoint) {
        agentMoving.value = true;
        agentPosition.value = point;

        setTimeout(() => {
            agentMoving.value = false;
        }, 750);
    }

    function moveAgentForward() {
        if (!selectedMap.value) return;
        if (currentStep.value === selectedMap.value.coins.length) return;
        moveAgent(currentStep.value + 1);
    }

    function moveAgentBackward() {
        if (currentStep.value === 0) return;
        moveAgent(currentStep.value - 1);
    }

    function moveAgent(step: number) {
        if (agentMoving.value) return;
        if (!selectedMap.value) return;
        if (steps.value === null) return;

        currentStep.value = step;
        currentNode.value = steps.value[currentStep.value].to_node;

        setAgentPosition(selectedMap.value.coins[currentNode.value]);
    }

    function setupKeyboardShortcuts() {
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                moveAgentForward();
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveAgentBackward();
            } else if (event.key === "Enter") {
                if (!selectedMap.value) return;
                event.preventDefault();

                moveAgent(selectedMap.value.coins.length);
            }
        });
    }

    async function calculateSteps() {
        if (!selectedMap.value) return;

        currentStep.value = 0;
        currentNode.value = 0;

        setAgentPosition(selectedMap.value.coins[currentNode.value]);

        loading.value = true;

        try {
            steps.value = await Client.calculateSteps(selectedMap.value.map_name, selectedAgent.value.name);
        } catch (error) {
            console.log("Calculate steps error:", error);
        }

        loading.value = false;
    }

    // Lifecycle
    onMounted(async () => {
        setupKeyboardShortcuts();
        await setupMaps();
    });
</script>

<style scoped lang="scss">
    #home {
        width: 100%;
        height: 100%;

        background-color: rgb(69, 69, 69);

        display: flex;
        gap: 20px;
        padding: 50px;

        .map {
            position: relative;
            height: 100%;

            flex-shrink: 0;

            display: flex;
            justify-content: center;
            align-items: center;

            img {
                width: 100%;
                height: 100%;
            }

            .agent {
                position: absolute;
                width: 90px;
                height: 90px;

                display: flex;
                justify-content: center;
                align-items: center;

                transition:
                    left 750ms,
                    top 750ms;

                transform: translate(-50%, -50%);

                img {
                    width: 100%;
                    height: 100%;
                }
            }

            .coin {
                position: absolute;
                width: 50px;
                height: 50px;

                display: flex;
                justify-content: center;
                align-items: center;

                user-select: none;
                pointer-events: none;

                > * {
                    user-select: none;
                    pointer-events: none;
                }

                transform: translate(-50%, -50%);

                img {
                    width: 100%;
                    height: 100%;
                }

                span {
                    position: absolute;

                    font-size: 1rem;
                    font-weight: bold;
                    color: black;
                }
            }

            .map-overlay {
                position: absolute;
                width: 100%;
                height: 100%;

                display: flex;
                flex-direction: column;
                justify-content: space-between;

                .header {
                    width: 100%;
                    height: 15%;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    gap: 20px;

                    .agent-selector {
                        height: 100%;

                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;

                        img {
                            height: 60%;

                            cursor: pointer;

                            transition: filter 0.2s;

                            &:hover {
                                filter: brightness(1.2);
                            }

                            &:active {
                                filter: brightness(0.8);
                            }
                        }

                        p {
                            margin: 0;
                            font-size: 1rem;
                            font-weight: bold;
                            color: white;
                        }
                    }
                }

                .footer {
                    width: 100%;
                    height: 15%;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    gap: 20px;

                    .map-selector {
                        height: 100%;

                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;

                        img {
                            height: 60%;
                            aspect-ratio: 1;

                            border-radius: 50%;

                            cursor: pointer;

                            transition: filter 0.2s;

                            &:hover {
                                filter: brightness(1.2);
                            }

                            &:active {
                                filter: brightness(0.8);
                            }
                        }

                        p {
                            margin: 0;
                            font-size: 1rem;
                            font-weight: bold;
                            color: white;
                        }
                    }
                }
            }
        }

        .steps-container {
            width: 100%;
            height: 100%;
            padding-block: 20px;

            border: 2px solid gray;

            display: flex;
            flex-direction: column;
            align-items: center;

            font-weight: bold;
            color: white;

            .steps {
                width: 100%;
                overflow-y: auto;

                flex-grow: 1;

                .step {
                    width: 100%;
                    height: 40px;
                    padding-inline: 40px;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    border-radius: 50%;
                    background-color: rgb(69, 69, 69);

                    transition: background-color 0.2s;
                }
            }

            .costs {
                width: 100%;
                height: 40px;
                padding-inline: 40px;

                display: flex;

                align-items: center;
                justify-content: space-between;

                border-radius: 50%;
                background-color: rgb(69, 69, 69);

                transition: background-color 0.2s;
            }
        }
    }

    .full-screen-loader {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;

        width: 100vw;
        height: 100vh;

        background-color: rgba(0, 0, 0, 0.5);

        display: flex;
        justify-content: center;
        align-items: center;
    }

    .loader {
        width: 48px;
        height: 48px;
        border: 5px solid rgba($color: #FFFFFF, $alpha: 0.75);
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
