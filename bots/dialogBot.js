const { ActivityHandler } = require('botbuilder');

class DialogBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     * @param {any} logger object for logging events, defaults to console if none is provided
     */
    constructor(conversationState, userState, dialog, logger) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        if (!logger) {
            logger = console;
            logger.log('[DialogBot]: logger not passed in, defaulting to console');
        }

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.logger = logger;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            this.logger.log('Running dialog with Message Activity.');

            // Ejecutar el diálogo con el nuevo mensaje de actividad.
            await this.dialog.run(context, this.dialogState);

            // Al llamar a next (), se asegura de que se ejecute el siguiente BotHandler.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Guardar cualquier cambio de estado. La carga ocurrió durante la ejecución del Diálogo.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // Al llamar a next (), se asegura de que se ejecute el siguiente BotHandler.
            await next();
        });
    }
}

module.exports.DialogBot = DialogBot;
