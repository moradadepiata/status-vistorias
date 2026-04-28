import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= TRADUZ STATUS =================
function traduzirStatus(status) {
  const mapa = {
    aguardando_liberacao: "Aguardando Liberação da Vistoria",
    vistoria_agendada: "Vistoria Agendada",
    vistoria_reprovada: "Vistoria Reprovada",
    vistoria_aprovada: "Vistoria Aprovada",
    revistoria_agendada: "Revistoria Agendada",
    revistoria_reprovada: "Revistoria Reprovada",
    revistoria_aprovada: "Revistoria Aprovada"
  };
  return mapa[status] || status;
}

// ================= FORMATA DATA E HORA =================
function formatarDataHora(data) {
	const d = new Date(data);

	const dia = String(d.getDate()).padStart(2, "0");
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const ano = d.getFullYear();

	const hora = String(d.getHours()).padStart(2, "0");
	const minuto = String(d.getMinutes()).padStart(2, "0");
	const segundo = String(d.getSeconds()).padStart(2, "0");

	return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

function calcularPercentual(valor, total) {
  if (total === 0) return "0,00";
  return ((valor / total) * 100).toFixed(2).replace(".", ",");
}











// ================= CACHE + FIREBASE =================

async function obterDadosAtualizados() {
  const snapshot = await getDocs(collection(db, "vistorias"));

  const dados = [];

  snapshot.forEach(doc => {
    dados.push(doc.data());
  });

  // salva no cache
  localStorage.setItem("vistorias_cache", JSON.stringify(dados));
  localStorage.setItem("vistorias_cache_data", new Date().toISOString());

  return dados;
}

function obterDadosCache() {
  const cache = localStorage.getItem("vistorias_cache");

  if (!cache) return [];

  return JSON.parse(cache);
}


















// ================= GRÁFICOS =================
function animarGrafico(element, percentual, cor) {
  let valor = 0;

  const incremento = percentual / 100; // 🔥 suaviza

  const intervalo = setInterval(() => {
    valor += incremento;

    if (valor >= percentual) {
      valor = percentual;
      clearInterval(intervalo);
    }

    element.style.background =
      `conic-gradient(${cor} ${valor}%, #ddd ${valor}%)`;

    element.innerHTML =
      `<span>${valor.toFixed(2).replace(".", ",")}%</span>`;

  }, 16);
}

document.addEventListener("DOMContentLoaded", () => {
	// ================= ELEMENTOS =================
	const selectTorre = document.getElementById("torre");
	const selectApto = document.getElementById("apto");
	const selectStatus = document.getElementById("status");

	const btnRegistro = document.getElementById("btnRegistro");
	const btnDashboard = document.getElementById("btnDashboard");
	const btnRetornar = document.getElementById("btnRetornar");	

	const btnSalvar = document.getElementById("btnSalvar");
	const resultado = document.getElementById("resultado");

	const filtroTorre = document.getElementById("filtroTorre");
	const filtroStatus = document.getElementById("filtroStatus");
	
	const botoesTorre = document.querySelectorAll(".btn-torre");
	
	const btnAtualizar = document.getElementById("btnAtualizar");
	
	// ================= FUNÇÕES =================
	function setState(state) {
		const cardHome = document.getElementById("cardHome");
		const cardRegistro = document.getElementById("cardRegistro");
		const containerRetornar = document.getElementById("containerRetornar");
		const resultado = document.getElementById("resultado");
		const cardDashboard = document.getElementById("cardDashboard");

		// esconde tudo
		cardHome.classList.add("hidden");
		cardRegistro.classList.add("hidden");
		cardDashboard.classList.add("hidden");
		containerRetornar.classList.add("hidden");
		
		// limpa feedback
		if (resultado) {
		  resultado.innerHTML = "";
		}
		
		if (state === "HOME") {
		  cardHome.classList.remove("hidden");
		}

		if (state === "REGISTRO") {
		  cardRegistro.classList.remove("hidden");
		  containerRetornar.classList.remove("hidden");
		  selectApto.disabled = true;
		  selectStatus.disabled = true;
		}

		if (state === "DASHBOARD") {
		  cardDashboard.classList.remove("hidden");
		  containerRetornar.classList.remove("hidden");

		  carregarDashboard();

		// ================= ATUALIZADO EM =================
		const elAtualizacao = document.querySelector(".dashboard-topo span");

		const agora = new Date();

		const dataFormatada = formatarDataHora(agora);

		elAtualizacao.textContent = "Última atualização: " + dataFormatada;
		}

	}
	
	// ================= BOTÕES TORRES =================
	function atualizarBotoesTorre(torreSelecionada) {
	  botoesTorre.forEach(btn => {
		btn.classList.remove("active");

		if (btn.dataset.torre === torreSelecionada) {
		  btn.classList.add("active");
		}
	  });
	}

	// ================= LISTA DE APARTAMENTOS =================
	function gerarApartamentos() {
		const apartamentos = [];
		for (let i = 1; i <= 8; i++) {
			apartamentos.push(String(i));
		}

		for (let andar = 1; andar <= 17; andar++) {
			for (let i = 1; i <= 8; i++) {
				apartamentos.push(andar + String(i).padStart(2, "0"));
			}
		}
		return apartamentos;
	}


	
	// ================= BUSCA STATUS SALVO =================
	async function carregarStatusSalvo(torre, apartamento) {
		try {
			const id = "torre_" + torre + "_apto_" + apartamento;

			const docRef = doc(db, "vistorias", id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return docSnap.data();
			} else {
			return null;
			}

		} catch (error) {
			console.error("Erro ao buscar status:", error);
		return null;
		}
	}

async function carregarDashboard(dados = null) {
	const torreSelecionada = filtroTorre.value;
  try {
    if (!dados) {
	dados = obterDadosCache();
}

    let total = 0;
    let aprovadas = 0;
    let reprovadas = 0;
    let agendadas = 0;
    let aguardando = 0;

	dados.forEach(data => {

	  // 🔥 FILTRO POR TORRE
		if (
		  torreSelecionada !== "todas" &&
		  String(data.torre) !== String(torreSelecionada)
		) {
		  return;
		}

	  total++;

	  const status = data.status;

if (status.includes("aprovada")) {
  aprovadas++;
}
else if (
  status.includes("reprovada") ||
  status.includes("revistoria_agendada")
) {
  reprovadas++;
}
else if (status.includes("agendada")) {
  agendadas++;
}
else if (status.includes("aguardando")) {
  aguardando++;
}
	});



document.getElementById("aprovadas").textContent = aprovadas;
document.getElementById("reprovadas").textContent = reprovadas;
document.getElementById("agendadas").textContent = agendadas;
document.getElementById("aguardando").textContent = aguardando;

document.getElementById("perc-aprovadas").textContent =
  `(${calcularPercentual(aprovadas, total)}%)`;

document.getElementById("perc-reprovadas").textContent =
  `(${calcularPercentual(reprovadas, total)}%)`;

document.getElementById("perc-agendadas").textContent =
  `(${calcularPercentual(agendadas, total)}%)`;

document.getElementById("perc-aguardando").textContent =
  `(${calcularPercentual(aguardando, total)}%)`;
  
  
  
  
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
  }
}

async function carregarGraficos(dados = null) {
  if (!dados) {
  dados = obterDadosCache();
	}

  const torres = {
    1: { total: 0, aprovadas: 0 },
    2: { total: 0, aprovadas: 0 },
    3: { total: 0, aprovadas: 0 },
    4: { total: 0, aprovadas: 0 },
    5: { total: 0, aprovadas: 0 }
  };

  dados.forEach(d => {
    const torre = d.torre;

    torres[torre].total++;

    if (d.status.includes("aprovada")) {
      torres[torre].aprovadas++;
    }
  });

  // cores das torres
  const cores = {
    1: "#d32f2f",
    2: "#fbc02d",
    3: "#1976d2",
    4: "#388e3c",
    5: "#eb31c5"
  };

  Object.keys(torres).forEach(t => {
    const { total, aprovadas } = torres[t];

    const percentual = total === 0
	  ? 0
	  : (aprovadas / total) * 100;

    const el = document.getElementById(`grafico-t${t}`);

    // reset antes de animar
    el.style.background = `conic-gradient(#ddd 0%)`;
    el.innerHTML = `<span>0%</span>`;

    animarGrafico(el, percentual, cores[t]);
  });
}


async function carregarGrid(dados = null) {
  const container = document.querySelector(".grid-unidades");
const novoGrid = document.createElement("div");
novoGrid.classList.add("grid-unidades");

  const torreSelecionada = filtroTorre.value;
  const statusSelecionado = filtroStatus.value;

const mostrarTudoCinza = torreSelecionada === "todas";

  if (!dados) {
  dados = obterDadosCache();
	}

  const mapa = {};

	dados.forEach(d => {
	  const key = `${d.torre}_${d.apartamento}`;
	  mapa[key] = d.status;
	});

  for (let andar = 17; andar >= 0; andar--) {

    const containerAndar = document.createElement("div");
    containerAndar.classList.add("andar-container");

    const label = document.createElement("div");
    label.classList.add("andar-label");
    label.textContent = andar === 0 ? "Térreo" : `${andar}º Andar`;

    const linha = document.createElement("div");
    linha.classList.add("andar");

    for (let i = 1; i <= 8; i++) {

      let numero = andar === 0
        ? String(i)
        : andar + String(i).padStart(2, "0");

      const div = document.createElement("div");
      div.classList.add("apto");
      div.textContent = numero;

      const key = `${torreSelecionada}_${numero}`;
      const status = mapa[key];

if (!mostrarTudoCinza && status) {

  let categoria = "";

  if (status.includes("aprovada")) categoria = "aprovada";
  else if (status.includes("reprovada") || status.includes("revistoria_agendada")) categoria = "reprovada";
  else if (status.includes("agendada")) categoria = "agendada";
  else if (status.includes("aguardando")) categoria = "aguardando";

  if (statusSelecionado !== "todos" && categoria !== statusSelecionado) {
    div.style.opacity = "0.8";
  } else {
    div.classList.add(categoria);
  }

} else {
  // 🔥 modo neutro (todas as torres)
  div.style.opacity = "0.8";
}

      linha.appendChild(div);
    }

    containerAndar.appendChild(label);
    containerAndar.appendChild(linha);
    novoGrid.appendChild(containerAndar);
  }
  container.replaceWith(novoGrid);
}






















	// ================= EVENTOS =================

	btnAtualizar.addEventListener("click", async () => {

	  // 🔥 busca Firebase + atualiza cache
	  const dados = await obterDadosAtualizados();

	  // 🔥 atualiza tela
	  carregarGrid(dados);
	  carregarDashboard(dados);
	  carregarGraficos(dados);

	  // 🔥 atualiza horário
	  const elAtualizacao = document.querySelector(".dashboard-topo span");
	  const agora = new Date();
	  const dataFormatada = formatarDataHora(agora);

	  elAtualizacao.textContent = "Última atualização: " + dataFormatada;
	});


	btnRegistro.addEventListener("click", () => {
		setState("REGISTRO");
	});

	btnDashboard.addEventListener("click", async () => {
		// 🔥 RESET COMPLETO
	  filtroTorre.value = "todas";
	  filtroStatus.value = "todos";

	  atualizarBotoesTorre(null);

	  setState("DASHBOARD");

	  // 🔥 busca Firebase + atualiza cache
	  const dados = await obterDadosAtualizados();

	  // 🔥 usa os dados carregados
	  carregarGrid(dados);
	  //carregarDashboard(dados);
	  carregarGraficos(dados);
	});

	btnRetornar.addEventListener("click", () => {
		// reset do formulário
		selectTorre.value = "";
		selectApto.innerHTML = '<option value="">Selecione</option>';
		selectStatus.value = "";
		
		setState("HOME");
	});
	
	// SALVAR
	btnSalvar.addEventListener("click", async () => {

		// limpa mensagem anterior
		resultado.innerHTML = "";

		// validações
		if (!selectTorre.value) {
		resultado.innerHTML = `<div class="feedback erro">
		<span class="icone">✖</span>
		<span>Informe a torre.</span>
		</div>`;
		return;
		}

		if (!selectApto.value) {
		resultado.innerHTML = `<div class="feedback erro">
		<span class="icone">✖</span>
		<span>Informe o apartamento.</span>
		</div>`;
		return;
		}

		if (!selectStatus.value) {
		resultado.innerHTML = `<div class="feedback erro">
		<span class="icone">✖</span>
		<span>Informe o status.</span>
		</div>`;
		return;
		}
		
		try {
			const id = "torre_" + selectTorre.value + "_apto_" + selectApto.value;
			

			
		// sucesso
		const dataAgora = new Date();

		await setDoc(doc(db, "vistorias", id), {
			torre: selectTorre.value,
			apartamento: selectApto.value,
			status: selectStatus.value,
			atualizadoEm: dataAgora
		});











		// 🔥 ATUALIZA CACHE SEM PERDER DADOS
		let cache = obterDadosCache();

		// remove se já existir (mesmo apto/torre)
		cache = cache.filter(item =>
		  !(item.torre == selectTorre.value && item.apartamento == selectApto.value)
		);

		// adiciona novo registro
		cache.push({
		  torre: selectTorre.value,
		  apartamento: selectApto.value,
		  status: selectStatus.value,
		  atualizadoEm: dataAgora
		});

		// salva novamente
		localStorage.setItem("vistorias_cache", JSON.stringify(cache));
		localStorage.setItem("vistorias_cache_data", new Date().toISOString());
		
		
		
		
		
		
		
		
		
		
		

		const statusTexto = traduzirStatus(selectStatus.value);
		const dataFormatada = formatarDataHora(dataAgora);

		resultado.innerHTML = `
		  <div class="feedback sucesso">
			<span class="icone">✔</span>
			<div>
			  <strong>Registro salvo com sucesso.</strong><br><br>
			  <span><strong>Torre:</strong> ${selectTorre.value}</span><br>
			  <span><strong>Apartamento:</strong> ${selectApto.value}</span><br>
			  <span><strong>Status:</strong> ${statusTexto}</span><br>
			  <span><strong>Registrado em:</strong> ${dataFormatada}</span>
			</div>
		  </div>
		`;

		// reset do formulário
		selectTorre.value = "";
		selectApto.innerHTML = '<option value="">Selecione</option>';
		selectStatus.value = "";


		selectApto.disabled = true;
		selectStatus.disabled = true;
			}
		catch (error) {

			console.error(error);
			resultado.innerHTML = `<div class="feedback erro">
			<span class="icone">✖</span>
			<span>Erro ao salvar. Tente novamente.</span>
			</div>`;
		}

	});

	// ================= SELECIONA APARTAMENTO APÓS A TORRE =================
	selectTorre.addEventListener("change", () => {
		
		// limpa feedback
		resultado.innerHTML = "";
		
		selectApto.innerHTML = '<option value="">Selecione</option>';
		selectStatus.disabled = true;
		selectStatus.value = "";
		
		if (!selectTorre.value) {
		  selectApto.disabled = true;
		  return;
		}

		const apartamentos = gerarApartamentos();

		apartamentos.forEach(apto => {
			const option = document.createElement("option");
			option.value = apto;
			option.textContent = apto;
			selectApto.appendChild(option);
		});

		selectApto.disabled = false;

	});

	selectApto.addEventListener("change", () => {
	  resultado.innerHTML = "";
	});
	
	selectStatus.addEventListener("change", () => {
	  resultado.innerHTML = "";
	});

	// ================= SELECIONA STATUS APÓS APARTAMENTO =================
	selectApto.addEventListener("change", async () => {

		if (selectTorre.value && selectApto.value) {
			selectStatus.disabled = false;
			
			
		// busca status no firebase
		const registro = await carregarStatusSalvo(
		  selectTorre.value,
		  selectApto.value
		);

		if (registro) {
			// preenche automaticamente
			selectStatus.value = registro.status;
		} else {
			// deixa vazio para seleção manual
			selectStatus.value = "";
		}

		}
		else {
			selectStatus.disabled = true;
			selectStatus.value = "";
		}

	});




// ================= BOTÕES TORRES =================
botoesTorre.forEach(btn => {
  btn.addEventListener("click", () => {
    const torre = btn.dataset.torre;

    filtroTorre.value = torre;
    atualizarBotoesTorre(torre);

    // 🔥 usa cache (não Firebase)
    const dados = obterDadosCache();

    carregarGrid(dados);
    carregarDashboard(dados);
  });
});


	//filtroTorre.addEventListener("change", carregarGrid);
filtroTorre.addEventListener("change", () => {

  const torre = filtroTorre.value;

  if (torre === "todas") {
    atualizarBotoesTorre(null);
  } else {
    atualizarBotoesTorre(torre);
  }

  // 🔥 usa cache (não chama Firebase)
  const dados = obterDadosCache();

  carregarGrid(dados);
  carregarDashboard(dados);
});


	filtroStatus.addEventListener("change", () => {

  // 🔥 usa cache
  const dados = obterDadosCache();

  carregarGrid(dados);
});


	// ================= INIT =================
	setState("HOME");
	selectApto.disabled = true;
	selectStatus.disabled = true;
}
);















// ================= POPULAR BASE (USO MANUAL) =================

window.popularBase = async function () {

  console.log("🚀 Iniciando população dos dados...");

  //const dataAgora = new Date();
  //força data de teste
  const dataAgora = new Date("2026-04-28T00:00:00Z");

  let total = 0;

  for (let torre = 1; torre <= 5; torre++) {

    for (let andar = 0; andar <= 17; andar++) {

      for (let i = 1; i <= 8; i++) {

        let numero;

        if (andar === 0) {
          numero = String(i);
        } else {
          numero = andar + String(i).padStart(2, "0");
        }

        const id = `torre_${torre}_apto_${numero}`;

        await setDoc(doc(db, "vistorias", id), {
          torre: String(torre),
          apartamento: numero,
          status: "aguardando_liberacao",
          atualizadoEm: dataAgora
        });

        total++;

        console.log(`✔ ${total} - Torre ${torre} | Apto ${numero}`);
      }
    }
  }

  console.log("🔥 FINALIZADO! 720 registros criados.");
};


// ================= LIMPAR BASE (USO MANUAL) =================

window.limparBase = async function () {

  console.log("🧹 Iniciando limpeza dos dados...");

  const snapshot = await getDocs(collection(db, "vistorias"));

  let total = 0;

  for (const docItem of snapshot.docs) {
    await deleteDoc(doc(db, "vistorias", docItem.id));

    total++;
    console.log(`🗑️ Removido: ${docItem.id}`);
  }

  console.log(`🔥 FINALIZADO! ${total} registros apagados.`);
};