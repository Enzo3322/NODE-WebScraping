const axios = require('axios');
const cheerio = require('cheerio');
const jsonfile = require('jsonfile');
const { unlink } = require('fs/promises');

const newsUrl =
	'https://www.gov.br/pt-br/noticias/ultimas-noticias?b_start:int=0';

const file = './news.json';

//remove arquivo da ultima consulta
try {
	unlink('./news.json');
} catch (error) {
	console.error('não foi possível remover o arquivo existente:', error.message);
}

function saveData(dt) {
	jsonfile
		.writeFile(file, dt, { spaces: 2, flag: 'a' })
		.then((res) => {})
		.catch((error) => console.error(error));
}

//Pega os links da pagina
const links = axios.get(newsUrl).then((resp) => {
	console.log('Buscando dados...');
	const dadoshtml = resp.data;
	const $ = cheerio.load(dadoshtml);
	const dados = [];
	$('a[class="summary url"]').each((i, e) => {
		const link = $(e).attr('href');
		//console.log(link)
		dados.push(link);
	});
	return dados;
});

//Função principal
async function main() {
	let news = [];
	let todoslinks = await links;
	for (let lnk of todoslinks) {
		await axios.get(lnk).then((resp) => {
			const dadoshtml = resp.data;
			const $ = cheerio.load(dadoshtml);
			const title = $('h1').text();
			const imgLink = $('img').attr('src');
			const publishDate = $('span[class="value"]').text();
			const textContent = $('div[property="rnews:articleBody"]').text();

			news.push({
				title,
				imgLink,
				publishDate,
				textContent,
			});
		});
	}
	console.log(`Foram gravadas ${news.length} matérias com sucesso`);

	saveData(news);
}
main();
