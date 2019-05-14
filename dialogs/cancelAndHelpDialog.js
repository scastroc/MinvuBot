const { ComponentDialog, DialogTurnStatus } = require('botbuilder-dialogs');

/**
 * Esta clase base busca frases comunes como "ayuda" y "cancelar" y toma medidas sobre ellas
 * ANTES de que alcancen la lógica normal del bot.
 */
class CancelAndHelpDialog extends ComponentDialog {

    async onBeginDialog(innerDc, options) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onBeginDialog(innerDc, options);
    }

    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        const text = innerDc.context.activity.text.toLowerCase();

        switch (text) {
        case 'help':
        case '?':
            await innerDc.context.sendActivity('[ Formula una pregunta o ingresa al menu de opciones para ver la informacion de subsidios. ]');
            return { status: DialogTurnStatus.waiting };
        case 'cancel':
        case 'quit':
        case 'salir':
            await innerDc.context.sendActivity('Cancelling');
            return await innerDc.cancelAllDialogs();
        }
    }
}

module.exports.CancelAndHelpDialog = CancelAndHelpDialog;
