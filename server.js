import express from 'express';
// Veja que agora adicionamos o ./src/ no caminho das duas rotas!
import userRoutes from './src/routes/userRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import materialPDFRoutes from './src/routes/materialPDFRoutes.js';
import backingTrackRoutes from './src/routes/backingTrackRoutes.js';
import loginRoute from './src/routes/loginRoute.js';


const app = express();
app.use(express.json());

app.use('/user', userRoutes);
app.use('/task', taskRoutes);
app.use('/materialPDF', materialPDFRoutes);
app.use('/backingTrack', backingTrackRoutes);
app.use('/login', loginRoute);

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000!");
});