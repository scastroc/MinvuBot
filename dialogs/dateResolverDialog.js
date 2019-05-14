const { DateTimePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');

const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class DateResolverDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'dateResolverDialog');
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT, this.dateTimePromptValidator.bind(this)))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialStep(stepContext) {
        const timex = stepContext.options.date;

        const promptMsg = 'On what date would you like to travel?';
        const repromptMsg = "I'm sorry, for best results, please enter your travel date including the month, day and year.";

        if (!timex) {
            // No se nos dio ninguna fecha, así que avise al usuario.
            return await stepContext.prompt(DATETIME_PROMPT,
                {
                    prompt: promptMsg,
                    retryPrompt: repromptMsg
                });
        } else {
            // Tenemos una fecha que solo tenemos que comprobar que no es ambigua.
            const timexProperty = new TimexProperty(timex);
            if (!timexProperty.types.has('definite')) {
                // Esto es esencialmente un "reprompt" de los datos que nos dieron por adelantado.
                return await stepContext.prompt(DATETIME_PROMPT, { prompt: repromptMsg });
            } else {
                return await stepContext.next({ timex: timex });
            }
        }
    }

    async finalStep(stepContext) {
        const timex = stepContext.result[0].timex;
        return await stepContext.endDialog(timex);
    }

    async dateTimePromptValidator(promptContext) {
        if (promptContext.recognized.succeeded) {
            // Este valor será un TIMEX. Y solo nos interesa la fecha, así que se obtiene el primer valor y ignora la parte de tiempo.
            const timex = promptContext.recognized.value[0].timex.split('T')[0];

            return new TimexProperty(timex).types.has('definite');
        } else {
            return false;
        }
    }
}

module.exports.DateResolverDialog = DateResolverDialog;
