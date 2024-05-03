document.addEventListener("DOMContentLoaded", function() {
    // Obtenha os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const wellCode = urlParams.get('wellCode');
    const wellSystem = urlParams.get('system');

    // Carregue os detalhes do poço
    loadWellDetails(wellCode, wellSystem);
});

function loadWellDetails(wellCode, wellSystem) {
    // Faça uma requisição para obter os dados do poço
    fetch('/' + wellSystem + '/Poco/' + wellCode)
        .then(response => {
            // Verifique se a requisição foi bem-sucedida
            if (!response.ok) {
                throw new Error('Network response was not ok' + response.statusText);
            }
            return response.json();
        })
        .then(well => {
            // Insira os detalhes do poço no HTML
            document.getElementById('well-code').textContent = 'Código: ' + well.Codigo;
            document.getElementById('well-uf').textContent = 'Uf: ' + well.Uf;
            // ... (insira os demais dados do poço no HTML)

            // Preencha a tabela de análises químicas
            var table = document.getElementById('analises-table');
            well.Analises.forEach(analysis => {
                var row = table.insertRow();
                row.insertCell().textContent = analysis.Nome_Ana;
                row.insertCell().textContent = analysis.Data_Ana;
                row.insertCell().textContent = analysis.Valor_Ana;
                row.insertCell().textContent = analysis.Uni_Ana;
            });
        })
        .catch(error => {
            // Log ou exiba o erro
            console.error('Erro ao carregar detalhes do poço:', error);
            document.body.innerHTML = '<h1>Erro ao carregar detalhes do poço.</h1>';
        });
}
