const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class BookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'bookingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.destinationStep.bind(this),
                this.originStep.bind(this),
                this.travelDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }
   
    async destinationStep(stepContext) {
        const intentDetails = stepContext.options;

        if (!intentDetails.destination) {
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'To what city would you like to travel?' });
        } else {
            return await stepContext.next(intentDetails.destination);
        }
    }
    
    async originStep(stepContext) {
        const intentDetails = stepContext.options;

        // Captura la respuesta a la solicitud del paso anterior
        intentDetails.destination = stepContext.result;
        if (!intentDetails.origin) {
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'From what city will you be travelling?' });
        } else {
            return await stepContext.next(intentDetails.origin);
        }
    }

    /**
     * Si no se ha proporcionado una fecha de viaje, solicite una.
     * Esto usará el DATE_RESOLVER_DIALOG.
     */
    async travelDateStep(stepContext) {
        const intentDetails = stepContext.options;

        // Captura los resultados del paso anterior.
        intentDetails.origin = stepContext.result;
        if (!intentDetails.travelDate || this.isAmbiguous(intentDetails.travelDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: intentDetails.travelDate });
        } else {
            return await stepContext.next(intentDetails.travelDate);
        }
    }
    
    async confirmStep(stepContext) {
        const intentDetails = stepContext.options;

        // Captura los resultados del paso anterior.
        intentDetails.travelDate = stepContext.result;
        const msg = `Please confirm, I have you traveling to: ${ intentDetails.destination } from: ${ intentDetails.origin } on: ${ intentDetails.travelDate }.`;

        // Ofrezca un mensaje SÍ / NO.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Completa la interacción y finaliza el diálogo.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const intentDetails = stepContext.options;

            return await stepContext.endDialog(intentDetails);
        } else {
            return await stepContext.endDialog();
        }
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.BookingDialog = BookingDialog;
