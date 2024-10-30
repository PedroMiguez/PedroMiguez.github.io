document.addEventListener("DOMContentLoaded", function() {
    const btnAcessar = document.querySelector(".btn-acessar");
    const painelAviso = document.getElementById("painelAviso");
    const sistema = document.getElementById("sistema");

    btnAcessar.addEventListener("click", function() {
        painelAviso.style.display = "none";  // esconde o painel de aviso
        overlay.style.display = "none"; 
        const iframe = window.parent.document.getElementById("painelFrame");
        iframe.style.display = "none";
    });
});
