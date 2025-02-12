const axios = require('axios');
const chalk = require('chalk');
const faker = require('@faker-js/faker');
const readlineSync = require('readline-sync');

// Função para delay entre tentativas
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Configurações de requisições
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    }
};

// Função para buscar domínios na nova API
async function getDomains() {
    let attempt = 0;
    const maxRetries = 5;
    while (attempt < maxRetries) {
        try {
            // Nova API para buscar domínios de e-mail
            const response = await axios.get('https://api.emailfake.com/getDomains', axiosConfig);
            if (response.data && Array.isArray(response.data.domains) && response.data.domains.length > 0) {
                return response.data.domains; // Retorna domínios encontrados na API
            }
            attempt++;
            await delay(2000); // Delay entre as tentativas
        } catch (error) {
            console.error(chalk.red(`[!] Error fetching domains: ${error.message}`));
            if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
                await getRandomProxy(); // Tentativa de usar proxy se necessário
            }
            attempt++;
            await delay(2000);
        }
    }
    return [];
}

// Função para buscar proxies aleatórios
async function getRandomProxy() {
    console.log(chalk.yellow('[!] Trying to use a proxy...'));
    try {
        const proxyList = await axios.get('https://api.proxies.com/get', axiosConfig);
        if (proxyList.data && Array.isArray(proxyList.data.proxies) && proxyList.data.proxies.length > 0) {
            const proxy = proxyList.data.proxies[Math.floor(Math.random() * proxyList.data.proxies.length)];
            console.log(chalk.green(`[+] Using proxy: ${proxy}`));
            axios.defaults.proxy = {
                host: proxy.host,
                port: proxy.port,
            };
        }
    } catch (error) {
        console.error(chalk.red(`[!] Error fetching proxies: ${error.message}`));
    }
}

// Geração de e-mails com base no domínio
function randomEmail(domain) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const randomNum = Math.floor(Math.random() * 900) + 100;

    // Customizando a criação do e-mail
    const emailName = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNum}`;
    return {
        name: emailName,
        email: `${emailName}@${domain}`
    };
}

// Função para gerar e-mails aleatórios
async function generateRandomEmail() {
    const domains = await getDomains();
    if (domains.length > 0) {
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const email = randomEmail(domain);
        console.log(chalk.green(`Generated email: ${email.email}`));
    } else {
        console.log(chalk.red('[!] No domains found.'));
    }
}

// Função para interação com o usuário
async function userInteraction() {
    const action = readlineSync.question(chalk.blue('[?] Do you want to generate a random email? (yes/no): '));
    if (action.toLowerCase() === 'yes') {
        await generateRandomEmail();
    } else {
        console.log(chalk.yellow('[*] Exiting program.'));
    }
}

// Execução do script
userInteraction();

