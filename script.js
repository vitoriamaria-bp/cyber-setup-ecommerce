// --- 1. CONFIGURAÇÃO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// SUA CONFIGURAÇÃO EXATA
const firebaseConfig = {
    apiKey: "AIzaSyCfqLttiRT49Ng5npYshOq3CzPmx59_y-Q",
    authDomain: "cyber-setup.firebaseapp.com",
    databaseURL: "https://cyber-setup-default-rtdb.firebaseio.com",
    projectId: "cyber-setup",
    storageBucket: "cyber-setup.firebasestorage.app",
    messagingSenderId: "342534017406",
    appId: "1:342534017406:web:bafde278baad44e347232f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- CONSTANTES E VARIÁVEIS ---
const DB_PRODUCTS = 'produtos';
const DB_CART = 'cyber_cart';
let metodoPagamento = 'Pix'; // Padrão inicial

// --- DADOS DE PREENCHIMENTO (SEED) ---
const defaultProducts = [
    { id: 1, name: "RTX 4090 Founder", price: 14999.00, img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=500&q=80", desc: "A GPU definitiva. Desempenho extremo para 4K e 8K gaming, ray tracing em tempo real e IA.", specs: ["24GB GDDR6X", "Arquitetura Ada Lovelace", "DLSS 3.0"] },
    { id: 2, name: "Teclado Mecânico RGB", price: 850.00, img: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80", desc: "Teclado mecânico compacto 60% com iluminação RGB personalizável e switches ópticos.", specs: ["Switches Blue Clicky", "Formato 60%", "Cabo USB-C Removível"] },
    { id: 3, name: "Monitor Gamer Curvo", price: 4100.00, img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80", desc: "Imersão total com tela curva de 32 polegadas, taxa de atualização de 165Hz e tempo de resposta de 1ms.", specs: ["32 Polegadas QHD", "165Hz / 1ms", "Painel VA Curvo 1500R"] },
    { id: 4, name: "Headset Wireless Pro", price: 750.00, img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=500&q=80", desc: "Áudio espacial THX, cancelamento de ruído ativo e bateria para 24h de jogo sem fios.", specs: ["Wireless 2.4Ghz", "Drivers 50mm", "Microfone ClearCast"] }
];

// --- FUNÇÕES GLOBAIS ---
window.showToast = function(msg) {
    const box = document.getElementById('toast-box') || document.body.appendChild(Object.assign(document.createElement('div'), {id:'toast-box'}));
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--neon-blue)"></i> ${msg}`;
    box.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// Verifica se o banco está vazio e preenche se necessário
window.verificarEPreencherBanco = async function() {
    const snapshot = await get(ref(db, DB_PRODUCTS));
    if (!snapshot.exists()) {
        console.log("Banco vazio. Preenchendo...");
        defaultProducts.forEach(p => set(ref(db, DB_PRODUCTS + '/' + p.id), p));
        window.showToast("Catálogo carregado!");
        setTimeout(() => location.reload(), 1000);
    }
}

// --- RENDERIZAÇÃO DA HOME (DESTAQUES) ---
window.renderHome = function() {
    const grid = document.getElementById('destaques-grid');
    if(!grid) return;
    onValue(ref(db, DB_PRODUCTS), (snapshot) => {
        grid.innerHTML = '';
        const data = snapshot.val();
        if(!data) { grid.innerHTML = '<p style="color:#777; grid-column:1/-1; text-align:center;">Carregando destaques...</p>'; return; }
        Object.values(data).slice(0, 3).forEach(p => grid.innerHTML += createCardHTML(p));
    });
}

// --- RENDERIZAÇÃO DA LOJA COMPLETA ---
window.renderStore = function() {
    const grid = document.getElementById('store-grid');
    if(!grid) return;
    const termo = document.getElementById('search-bar') ? document.getElementById('search-bar').value.toLowerCase() : '';
    onValue(ref(db, DB_PRODUCTS), (snapshot) => {
        grid.innerHTML = '';
        const data = snapshot.val();
        if(!data) { grid.innerHTML = '<p style="color:#777; grid-column:1/-1; text-align:center;">Nenhum produto encontrado.</p>'; return; }
        Object.values(data).forEach(p => {
            if(p.name.toLowerCase().includes(termo)) grid.innerHTML += createCardHTML(p);
        });
    });
}

// Cria o HTML do card de produto
function createCardHTML(p) {
    const imgUrl = p.img || 'https://via.placeholder.com/400x300?text=Sem+Imagem';
    return `
    <div class="card">
        <div class="card-img" style="background-image: url('${imgUrl}')"></div>
        <div class="card-body">
            <h3>${p.name}</h3>
            <span class="price">R$ ${p.price.toLocaleString('pt-BR')}</span>
            <div class="btn-group">
                <a href="detalhes.html?id=${p.id}" class="btn btn-outline" style="flex:1">VER</a>
                <button class="btn btn-primary" style="width:auto; padding: 0 20px;" onclick="window.addToCart(${p.id})"><i class="fa-solid fa-cart-plus"></i></button>
            </div>
        </div>
    </div>`;
}

// --- PÁGINA DE DETALHES ---
window.carregarDetalhes = function() {
    if (!window.location.href.includes('detalhes.html')) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    
    onValue(ref(db, DB_PRODUCTS + '/' + id), (snapshot) => {
        const p = snapshot.val();
        if (p) {
            document.getElementById('detalhe-img').src = p.img;
            document.getElementById('detalhe-nome').innerText = p.name;
            document.getElementById('detalhe-desc').innerText = p.desc;
            document.getElementById('detalhe-preco').innerText = "R$ " + p.price.toLocaleString('pt-BR');
            
            // Recria o botão para limpar eventos antigos
            const btnOld = document.getElementById('btn-add-detalhe');
            const btnNew = btnOld.cloneNode(true);
            btnOld.parentNode.replaceChild(btnNew, btnOld);
            btnNew.addEventListener('click', () => window.addToCart(p.id));
            
            // Renderiza especificações
            const lista = document.getElementById('lista-specs');
            if(lista && p.specs) {
                lista.innerHTML = '';
                p.specs.forEach(s => lista.innerHTML += `<li><i class="fa-solid fa-microchip"></i> ${s}</li>`);
            }
        }
    });
}

// --- LÓGICA DO CARRINHO ---
window.addToCart = function(id) {
    get(ref(db, DB_PRODUCTS + '/' + id)).then((snap) => {
        if(snap.exists()) {
            let cart = JSON.parse(localStorage.getItem(DB_CART)) || [];
            cart.push(snap.val());
            localStorage.setItem(DB_CART, JSON.stringify(cart));
            window.updateCount();
            window.showToast(`${snap.val().name} adicionado!`);
        }
    });
}

window.updateCount = function() {
    const el = document.getElementById('cart-count');
    if(el) el.innerText = (JSON.parse(localStorage.getItem(DB_CART)) || []).length;
}

// Seleção de Pagamento (Pix/Cartão)
window.selectPay = function(element, method) {
    document.querySelectorAll('.pay-opt').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    metodoPagamento = method;
}

// Renderiza a página do carrinho
window.renderCartPage = function() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if(!container) return;

    let cart = JSON.parse(localStorage.getItem(DB_CART)) || [];
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed #333;">
                <i class="fa-solid fa-cart-arrow-down" style="font-size: 4rem; color: #333; margin-bottom: 20px;"></i>
                <p style="color:#888; font-size: 1.1rem;">Seu carrinho está vazio.</p>
                <a href="loja.html" class="btn btn-outline" style="display:inline-block; margin-top:20px; width:auto;">IR PARA A LOJA</a>
            </div>`;
    } else {
        cart.forEach((item, index) => {
            total += parseFloat(item.price);
            container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span>R$ ${item.price.toLocaleString('pt-BR')}</span>
                </div>
                <button onclick="window.removeItem(${index})" style="color: #ff4444; background: none; border: 2px solid #ff4444; border-radius:8px; padding: 10px 15px; cursor: pointer; transition:0.3s;" onmouseover="this.style.background='#ff4444';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#ff4444'">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>`;
        });
    }

    const valorFormatado = "R$ " + total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    if(subtotalEl) subtotalEl.innerText = valorFormatado;
    if(totalEl) totalEl.innerText = valorFormatado;
}

window.removeItem = function(index) {
    let cart = JSON.parse(localStorage.getItem(DB_CART)) || [];
    cart.splice(index, 1);
    localStorage.setItem(DB_CART, JSON.stringify(cart));
    window.renderCartPage();
    window.updateCount();
}

window.finalizarCompraZap = function() {
    const cart = JSON.parse(localStorage.getItem(DB_CART)) || [];
    const nome = document.getElementById('cliente-nome').value;
    const endereco = document.getElementById('cliente-endereco').value;
    
    if(cart.length === 0) return window.showToast("Seu carrinho está vazio!");
    if(!nome || !endereco) return window.showToast("Preencha os dados de entrega!");

    // --- AQUI ESTÁ A CORREÇÃO DO TEXTO ---
    let msg = `Olá! Vim pelo site e gostaria de fechar o seguinte pedido no *CYBER.SETUP*: 🚀\n\n`;
    
    msg += `👤 *Meus Dados:* ${nome}\n`;
    msg += `📍 *Entregar em:* ${endereco}\n`;
    msg += `💳 *Prefiro pagar via:* ${metodoPagamento}\n\n`;
    
    msg += `📦 *MEUS ITENS:*\n`;
    
    let total = 0;
    cart.forEach(i => { 
        msg += `▪️ ${i.name} | R$ ${i.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`; 
        total += parseFloat(i.price); 
    });
    
    msg += `\n💰 *TOTAL DO PEDIDO: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}*\n`;
    msg += `\nFico no aguardo da confirmação e da chave Pix (ou link) para pagamento!`;

    // Lembre-se: Este número aqui é o da LOJA (Você), que vai receber o pedido.
    window.open(`https://wa.me/5511959784098?text=${encodeURIComponent(msg)}`, '_blank');
}

// --- PAINEL ADMIN ---
window.initAdmin = function() {
    const form = document.getElementById('formAdmin');
    const lista = document.getElementById('admin-lista');
    if(!form) return;
    onValue(ref(db, DB_PRODUCTS), (snap) => {
        lista.innerHTML = '';
        if(snap.val()) Object.values(snap.val()).forEach(p => {
            lista.innerHTML += `
            <tr>
                <td><img src="${p.img}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid var(--neon-blue)"></td>
                <td style="font-weight:bold; color:white;">${p.name}</td>
                <td style="color:var(--neon-blue);">R$ ${p.price.toLocaleString('pt-BR')}</td>
                <td><button onclick="window.delProd(${p.id})" style="color:red;background:none;border:1px solid red; padding:5px 10px; border-radius:4px; cursor:pointer;">Excluir</button></td>
            </tr>`;
        });
    });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Date.now();
        const newP = {
            id: id,
            name: document.getElementById('prod-nome').value,
            price: parseFloat(document.getElementById('prod-preco').value),
            img: document.getElementById('prod-img').value,
            desc: document.getElementById('prod-desc').value,
            specs: ["Novo Produto"]
        };
        set(ref(db, DB_PRODUCTS + '/' + id), newP).then(() => { window.showToast("Produto salvo!"); form.reset(); });
    });
}
window.delProd = function(id) { if(confirm("Tem certeza que deseja apagar este produto?")) remove(ref(db, DB_PRODUCTS + '/' + id)); }

// --- INICIALIZAÇÃO GERAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica banco e inicia funções
    window.verificarEPreencherBanco();
    window.updateCount();
    window.renderHome();
    window.renderStore();
    window.renderCartPage();
    window.initAdmin();
    window.carregarDetalhes();
});
