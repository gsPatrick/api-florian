// index.js - Servidor Express para envio de e-mails

// 1. Importação dos pacotes
require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

// 2. Configuração do Servidor
const app = express();
const PORT = process.env.PORT || 3001; // Usa a porta do ambiente ou 3001 como padrão

// 3. Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const notificationEmail = process.env.RESEND_NOTIFICATION_EMAIL;
const fromEmail = process.env.RESEND_FROM_EMAIL;

// 4. Middlewares
app.use(cors()); // Habilita CORS para permitir requisições do seu frontend
app.use(express.json()); // Permite que o servidor entenda requisições com corpo em JSON

// 5. Definição da Rota (Endpoint)
app.post('/send', async (req, res) => {
  try {
    const { fullName, email, country, revenue, countryCode, phone } = req.body;

    // Validação básica no servidor
    if (!fullName || !email || !country || !revenue || !phone || !notificationEmail || !fromEmail) {
      console.error("Missing required fields or environment variables");
      return res.status(400).json({ error: 'Missing required fields or server configuration' });
    }

    // Promessa para enviar os dois e-mails em paralelo
    const [notificationResponse, confirmationResponse] = await Promise.all([
      // 1. E-mail de notificação para Florian (convertido para HTML)
      resend.emails.send({
        from: `Keystone New Lead <${fromEmail}>`,
        to: [notificationEmail],
        subject: `Nova Avaliação Estratégica Agendada por ${fullName}`,
        html: `
          <div>
            <h1>Nova Solicitação de Avaliação Estratégica</h1>
            <p>Um novo lead preencheu o formulário no site.</p>
            <hr />
            <h2>Detalhes do Lead:</h2>
            <p><strong>Nome:</strong> ${fullName}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>País:</strong> ${country}</p>
            <p><strong>Receita Anual (USD):</strong> ${revenue}</p>
            <p><strong>Telefone:</strong> ${countryCode} ${phone}</p>
            <hr />
            <p>O lead foi redirecionado para o Calendly para agendar a reunião.</p>
          </div>
        `,
      }),
      // 2. E-mail de confirmação para o Lead (convertido para HTML)
      resend.emails.send({
        from: `Keystone Consulting <${fromEmail}>`,
        to: [email],
        subject: `Próximo passo: Agende sua Avaliação Estratégica na Keystone`,
        html: `
          <div>
            <h1>Obrigado, ${fullName}!</h1>
            <p>Recebemos suas informações com sucesso. O primeiro passo para escalar seu negócio com clareza foi dado.</p>
            <p><strong>O próximo passo é agendar sua avaliação gratuita no nosso Calendly.</strong> Você já foi redirecionado para a página de agendamento.</p>
            <hr />
            <h3>Resumo das suas informações:</h3>
            <p><strong>Nome:</strong> ${fullName}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>País:</strong> ${country}</p>
            <p><strong>Receita Anual (USD):</strong> ${revenue}</p>
            <p><strong>Telefone:</strong> ${countryCode} ${phone}</p>
            <hr />
            <p>Atenciosamente,</p>
            <p>Equipe Keystone Consulting</p>
          </div>
        `,
      }),
    ]);

    // Verificação de sucesso de ambos os e-mails
    if (notificationResponse.error || confirmationResponse.error) {
      console.error("Error sending emails:", { notificationResponse, confirmationResponse });
      return res.status(500).json({
        error: "An error occurred while sending emails.",
        details: { notification: notificationResponse.error, confirmation: confirmationResponse.error }
      });
    }

    return res.status(200).json({ success: true, message: 'Emails sent successfully!' });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Iniciar o Servidor
app.listen(PORT, () => {
  console.log(`Servidor de e-mail rodando na porta ${PORT}`);
});