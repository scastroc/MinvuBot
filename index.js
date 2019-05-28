const path = require('path');
const restify = require('restify');

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');

// El diálogo principal de este bot.
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Se crea adaptador.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
 
// Catch-all para errores.
adapter.onTurnError = async (context, error) => {
    // Escribe errores en el log.    
    console.error(`\n [onTurnError]: ${ error }`);
    // Envia mensaje de error al usuario.
    await context.sendActivity(`Ups, ha ocurrido un problema!`);
    // Limpiar estado.
    await conversationState.delete(context);
};

// Definir estado de la conversacion.
// Un bot requiere almacenar un estado para mantener el diálogo y el estado del usuario entre los mensajes.
let conversationState, userState;

// PRECAUCIÓN: el almacenamiento de memoria utilizado aquí es solo para la depuración del bot local. Cuando el bot
// se reinicia, todo lo almacenado en la memoria desaparecerá.
/* const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage); */

var storage = new CosmosDbStorage({
    serviceEndpoint: process.env.DB_SERVICE_ENDPOINT, 
    authKey: process.env.AUTH_KEY, 
    databaseId: process.env.DATABASE,
    collectionId: process.env.COLLECTION
}) 

const logger = console;

// Se crea el dialogo principal.
const dialog = new MainDialog(logger);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog, logger);

// Se crea el Servidor HTTP
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
});

// Escuche las actividades entrantes y diríjalas al diálogo principal de su bot.
server.post('/api/messages', (req, res) => {
    
    adapter.processActivity(req, res, async (turnContext) => {
        // Ruta al manejador de actividad del bot.
        await bot.run(turnContext);
    });
});
