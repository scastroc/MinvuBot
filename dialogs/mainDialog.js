const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { BookingDialog } = require('./bookingDialog');
const { LuisHelper } = require('./luisHelper');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const BOOKING_DIALOG = 'bookingDialog';

class MainDialog extends ComponentDialog {
    constructor(logger) {
        super('MainDialog');

        if (!logger) {
            logger = console;
            logger.log('[MainDialog]: logger not passed in, defaulting to console');
        }

        this.logger = logger;

        // Definir el diálogo principal y sus componentes relacionados.        
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new BookingDialog(BOOKING_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * El método de ejecución maneja la actividad entrante (en forma de TurnContext) y la pasa a través del sistema de diálogo.
     * Si no hay ningún diálogo activo, se iniciará el diálogo predeterminado.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * Primer paso en el diálogo de cascada. Solicita al usuario un comando.
     */
    async introStep(stepContext) {
        if (!process.env.LuisAppId || !process.env.LuisAPIKey || !process.env.LuisAPIHostName) {
            await stepContext.context.sendActivity('NOTA: LUIS no está configurado. Para habilitar todas las capacidades, agregue `LuisAppId`,` LuisAPIKey` y `LuisAPIHostName` al archivo .env.');
            return await stepContext.next();
        }

        return await stepContext.prompt('TextPrompt', { prompt: 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"' });
    }

    /**
     * Segundo paso en la cascada. Esto utilizará LUIS para intentar extraer los datos y algun intent para procesar la solicitud.
     */
    async actStep(stepContext) {
        let intentDetails = {};

        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Llama a LUIS y reúna los posibles detalles del intent.            
            intentDetails = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);

            this.logger.log('LUIS extrajo estos detalles de la intent:', intentDetails);
        }

        // En esta muestra solo tenemos una única intent. Sin embargo, típicamente un escenario
        // tendrá varias intent diferentes, cada uno correspondiente al inicio de un diálogo secundario diferente.

        // Ejecutar BookingDialog dándole los detalles que tengamos de la llamada a LUIS, se llenará el resto.
        return await stepContext.beginDialog('bookingDialog', intentDetails);
    }

    /**
     * Este es el paso final en el diálogo principal de cascada.     
     */
    async finalStep(stepContext) {
        
        if (stepContext.result) {
            const result = stepContext.result;
            
            // Aquí es donde irán las llamadas al servicio de reserva AOU o la base de datos.

            // Si la llamada al servicio de reservas fue exitosa, infórmeselo al usuario.
            const timeProperty = new TimexProperty(result.travelDate);
            const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
            const msg = `I have you booked to ${ result.destination } from ${ result.origin } on ${ travelDateMsg }.`;
            await stepContext.context.sendActivity(msg);
        } else {
            await stepContext.context.sendActivity('Thank you.');
        }
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
