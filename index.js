const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const apiBaseUrl = 'https://circleci.com/api/v1.1';

const ColorForBuildState = {
    "timedout": "#FFCC00", // yellow
    "no_tests":  "#FFCC00", // yellow
    "canceled": "#0000FF", // blue
    "success": "#00FF00", // green
    "infrastructure_fail": "#FF0000", // red
    "failed": "#FF0000" // red
}

const EffectForBuildState = {
    "timedout": q.Effects.BLINK,
    "no_tests": q.Effects.SET_COLOR,
    "canceled": q.Effects.SET_COLOR,
    "success": q.Effects.SET_COLOR,
    "infrastructure_fail": q.Effects.BLINK,
    "failed": q.Effects.BLINK
}

const MessageForBuildState = {
    "timedout": `Build Timed Out`,
    "no_tests": `Build Has No Tests`,
    "canceled": `Build Canceled`,
    "success": `Build Passed`,
    "infrastructure_fail": `Build Not Run Due To Infrastructure Failure`,
    "failed": `Build Failed`
}

async function processProjectsResponse(response) {
    logger.info(`Processing CircleCI projects response`);
    const options = [];
    response.forEach(project => {
        options.push({
            key: project.reponame.toString(),
            value: project.reponame.toString()
        });
    });
    logger.info(`got ${options.length} options`);
    options.forEach(o => logger.info(`${o.key}: ${o.value}`));
    return options;
}

class CircleCIBuildInfo extends q.DesktopApp {
    constructor() {
        super();
        // run every minute
        this.pollingInterval = 60000;
    }

    /**
     * Loads the list of repose from the Travis API
     */
    async loadProjects() {
        logger.info(`Loading projects`);
        const options = {
            uri: apiBaseUrl + `/projects?circle-token=${this.authorization.apiKey}`,
            json: true
        }
        return request.get(options);
    }

    /**
     * Called from the Das Keyboard Q software to retrieve the options to display for
     * the user inputs
     * @param {} fieldId 
     * @param {*} search 
     */
    async options(fieldId, search) {
        return this.loadProjects().then(body => {
            return processProjectsResponse(body);
        }).catch(error => {
            logger.error(`Caught error when loading options: ${error}`);
        });
    }

    /**
     * Request to fetch the builds.
     */
    async getBuilds() {
        const options = {
            // uri: apiBaseUrl + `/recent-builds?circle-token=${this.authorization.apiKey}&limit=1`,
            uri: apiBaseUrl + `/project/${this.config.vcs}/${this.config.username}/${this.config.project}?circle-token=${this.authorization.apiKey}&limit=1&filter=completed`,
            json: true
        }
        return request.get(options);
    }

    /**
     * Runs every N second. Will fetch the latest build of the chosen repoId and
     * send a signal to the Das Keyboard Q Software depending on the build state
     */
    async run() {
        logger.info(`CircleCI running.`);

        return this.getBuilds().then(body => {
            const latestBuild = body[0];
            let signalColor;
            let signalEffect;
            let signalMessage;
            if (latestBuild) {
                const latestBuildState = latestBuild.outcome;
                /* set the signal color depending on the build state. 
                White if state not recognized */
                logger.info(`Latest build state ${latestBuildState}`);
                if (Object.keys(ColorForBuildState).includes(latestBuildState)) {
                    signalColor = ColorForBuildState[latestBuildState];
                } else {
                    signalColor = '#FFFFFF';
                }
                /**
                 * set the signal effect depending on the build state.
                 * SET_COLOR if state not recognized
                 */
                if (Object.keys(EffectForBuildState).includes(latestBuildState)) {
                    signalEffect = EffectForBuildState[latestBuildState];
                } else {
                    signalEffect = q.Effects.SET_COLOR;
                }
                /**
                 * set the signal message depending on the build state.
                 */
                if (Object.keys(MessageForBuildState).includes(latestBuildState)) {
                    signalMessage = MessageForBuildState[latestBuildState];
                } else {
                    signalMessage = `Build state not recognized`;
                }
                // get the repository name from the builds request.
                const repoName = latestBuild.reponame;
                // get the build_url from the builds request.
                const buildUrl = latestBuild.build_url
                // Send the signal
                let signal = new q.Signal({
                    points: [[new q.Point(signalColor, signalEffect)]],
                    name: `CircleCI`,
                    message: `${repoName}: ` + signalMessage,
                    link: {
                        url: `${buildUrl}`,
                        label: `Show in CircleCI`
                    }
                });

                return signal;
            } else {
                return null;
            }
        }).catch(error => {
            logger.error(`Error while getting builds: ${error}`);
            if(`${error.message}`.includes("getaddrinfo")){
                return q.Signal.error(
                  'The CircleCI service returned an error. <b>Please check your internet connection</b>.'
                );
              }
              return q.Signal.error([
                'The CircleCI service returned an error. <b>Please check your API key and account</b>.',
                `Detail: ${error.message}`
              ]);
        })
    }
}

module.exports = {
    CircleCIBuildInfo: CircleCIBuildInfo,
    processProjectsResponse: processProjectsResponse
}

const applet = new CircleCIBuildInfo();