const { LuisRecognizer } = require('botbuilder-ai');

class LuisHelper {
    /**
     * Devuelve un objeto con resultados LUIS preformateados para que los diálogos del bot los consuman.
     * @param {*} logger
     * @param {TurnContext} context
     */
    static async executeLuisQuery(logger, context) {
        //const  bookingDetails = {};
        const intentDetails = {};

        try {
            const recognizer = new LuisRecognizer({
                applicationId: process.env.LuisAppId,
                endpointKey: process.env.LuisAPIKey,
                endpoint: process.env.LuisAPIHostName
            }, {}, true);

            // Esto recoge todas las intent de la llamada a LUIS.
            const recognizerResult = await recognizer.recognize(context);

            // Esto recupera el intent con mayor porcentaje de exactitud.
            const intent = LuisRecognizer.topIntent(recognizerResult);
            // Se almacena  resultado de la intent
            intentDetails.intent = intent;

            console.log(recognizerResult.intents[0].score + ': intent score');
            console.log(recognizerResult.alteredText + ': altered text');
            console.log(recognizerResult.entities + ': entities');
            console.log(recognizerResult.text + ': text');
            console.log(LuisRecognizer.topIntent(recognizerResult) + ': top intent');

            if (intent === 'Book_flight') {
                // Necesitamos obtener el resultado del LUIS JSON que en cada nivel devuelve un array

                intentDetails.destination = LuisHelper.parseCompositeEntity(recognizerResult, 'To', 'Airport');
                intentDetails.origin = LuisHelper.parseCompositeEntity(recognizerResult, 'From', 'Airport');
                // Este valor será un TIMEX. Y solo nos interesa la fecha, así que se obtiene el primer valor y ignora la parte de tiempo.
                intentDetails.travelDate = LuisHelper.parseDatetimeEntity(recognizerResult);
            }
            // Intent de Arriendo.
            if (intent === 'arriendo') {
                intentDetails.ahorro = LuisHelper.parseCompositeEntity(recognizerResult);

                //intentDetails.postulacion = LuisHelper.parseDatetimeEntity(recognizerResult);

            }
        } catch (err) {
            logger.warn(`LUIS Exception: ${err} Check your LUIS configuration`);
        }
        return intentDetails;

    }

    static parseCompositeEntity(result, compositeName, entityName) {
        const compositeEntity = result.entities[compositeName];
        if (!compositeEntity || !compositeEntity[0]) return undefined;

        const entity = compositeEntity[0][entityName];
        if (!entity || !entity[0]) return undefined;

        const entityValue = entity[0][0];
        return entityValue;
    }

    static parseDatetimeEntity(result) {
        const datetimeEntity = result.entities['datetime'];
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0]['timex'];
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.LuisHelper = LuisHelper;
