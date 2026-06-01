import React, { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:3001/api";

const EMOJI_MAP = {
  "ABACATE": "🥑", "ABACAXI": "🍍", "ABOBRINHA": "🥒", "ACELGA": "🥬",
  "ACEROLA": "🍒", "ALFACE": "🥬", "ALHO": "🧄", "AMEIXA": "🫐",
  "AMENDOIM": "🥜", "BANANA": "🍌", "BATATA": "🥔", "BERINJELA": "🍆",
  "BETERRABA": "🫚", "BROCOLIS": "🥦", "CAJU": "🌰", "CEBOLA": "🧅",
  "CENOURA": "🥕", "COCO": "🥥", "COENTRO": "🌿", "COGUMELO": "🍄",
  "COUVE": "🥬", "FEIJAO": "🫘", "GENGIBRE": "🫚", "GOIABA": "🍈",
  "GRAVIOLA": "🍈", "KIWI": "🥝", "LARANJA": "🍊", "LIMAO": "🍋",
  "MACA": "🍎", "MACAXEIRA": "🍠", "MAMAO": "🍈", "MANGA": "🥭",
  "MARACUJA": "🍋", "MELANCIA": "🍉", "MELAO": "🍈", "MILHO": "🌽",
  "MORANGO": "🍓", "PEPINO": "🥒", "PERA": "🍐", "PIMENTA": "🌶️",
  "PIMENTAO": "🫑", "QUIABO": "🌿", "REPOLHO": "🥬", "TANGERINA": "🍊",
  "TOMATE": "🍅", "UVA": "🍇", "VAGEM": "🫘", "JERIMUM": "🎃",
  "JILO": "🫛", "MAXIXE": "🥒", "CARA": "🍠", "CAJA": "🍑",
  "GOMA": "🍞", "UMBU": "🍑",
};

function getEmoji(desc) {
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (desc.includes(key)) return emoji;
  }
  return "🌱";
}

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TABS = ["🛒 PDV", "📦 Estoque", "📋 Separação"];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [estoque, setEstoque] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState("");
  const [pedidos, setPedidos] = useState([]);
  
  const [modalPagto, setModalPagto] = useState(false);
  const [pagtoTipo, setPagtoTipo] = useState("dinheiro");
  const [qtdModal, setQtdModal] = useState(null);
  const [qtdTemp, setQtdTemp] = useState("1");

  const searchRef = useRef();

  // Buscar dados da API
  const carregarDados = async () => {
    try {
      const resProd = await fetch(`${API_URL}/produtos`);
      const dataProd = await resProd.json();
      setEstoque(dataProd);

      const resPed = await fetch(`${API_URL}/pedidos`);
      const dataPed = await resPed.json();
      setPedidos(dataPed);
    } catch (err) {
      console.error("Erro ao carregar dados da API", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [activeTab]);

  const produtosFiltrados = estoque.filter(p =>
    p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    String(p.codigo).includes(busca)
  );

  const totalCarrinho = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0);

  function adicionarAoCarrinho(prod, qtd = 1) {
    if (prod.estoque < qtd) {
      alert("Quantidade superior ao estoque disponível!");
      return;
    }
    setCarrinho(c => {
      const idx = c.findIndex(i => i.codigo === prod.codigo);
      if (idx >= 0) {
        const novo = [...c];
        novo[idx] = { ...novo[idx], qtd: novo[idx].qtd + Number(qtd) };
        return novo;
      }
      return [...c, { ...prod, qtd: Number(qtd) }];
    });
    setQtdModal(null);
  }

  async function finalizarVenda() {
    try {
      const res = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: carrinho,
          pagamento: pagtoTipo,
          total: totalCarrinho
        })
      });
      if (res.ok) {
        setCarrinho([]);
        setModalPagto(false);
        alert("Pedido enviado para separação!");
        carregarDados();
      }
    } catch (err) {
      alert("Erro ao enviar venda");
    }
  }

  async function alterarStatusPedido(id, novoStatus) {
    try {
      await fetch(`${API_URL}/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #0f2027 100%)",
      fontFamily: "'Nunito', sans-serif",
      color: "#e8f5e9",
      display: "flex",
      flexDirection: "column",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #1b5e20, #2e7d32)",
        padding: "16px 20px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#a5d6a7" }}>🌿 HortiGest</div>
          <div style={{ fontSize: 11, color: "#81c784" }}>Controle de Estoque & Separação</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#12291a", borderBottom: "2px solid #1b5e20" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            flex: 1, padding: "12px 4px",
            background: activeTab === i ? "linear-gradient(180deg, #2e7d32, #1b5e20)" : "transparent",
            border: "none", color: activeTab === i ? "#a5d6a7" : "#4a7c59",
            fontWeight: 800, fontSize: 12, cursor: "pointer",
            borderBottom: activeTab === i ? "3px solid #69f0ae" : "3px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {/* ======= TAB 0: PDV ======= */}
      {activeTab === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 10 }}>
          <input
            ref={searchRef} value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            style={{ padding: 10, borderRadius: 8, border: "1px solid #2e7d32", background: "#1a3a2a", color: "#fff", marginBottom: 10 }}
          />

          <div style={{ flex: 1, overflowY: "auto" }}>
            {produtosFiltrados.map(prod => (
              <div key={prod.id} onClick={() => setQtdModal(prod)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#162d1f", padding: 10, marginBottom: 5, borderRadius: 8, border: "1px solid #2e7d32"
              }}>
                <div>
                  <strong>{getEmoji(prod.descricao)} {prod.descricao}</strong>
                  <div style={{ fontSize: 11, color: '#81c784' }}>Estoque: {prod.estoque} {prod.unidade}</div>
                </div>
                <span style={{ color: "#69f0ae", fontWeight: "bold" }}>{fmt(prod.preco)}</span>
              </div>
            ))}
          </div>

          {/* Carrinho de Compras */}
          {carrinho.length > 0 && (
            <div style={{ background: "#1b5e20", padding: 10, borderRadius: 8, marginTop: 10 }}>
              <h4>Carrinho Atual</h4>
              {carrinho.map(item => (
                <div key={item.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.descricao} ({item.qtd}x)</span>
                  <span>{fmt(item.preco * item.qtd)}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontWeight: "bold" }}>Total: {fmt(totalCarrinho)}</div>
              <button onClick={() => setModalPagto(true)} style={{ width: "100%", padding: 10, background: "#69f0ae", border: "none", borderRadius: 5, fontWeight: "bold", marginTop: 5, cursor: "pointer" }}>
                Fechar Pedido
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======= TAB 1: ESTOQUE ======= */}
      {activeTab === 1 && (
        <div style={{ padding: 15 }}>
          <h3>Gerenciamento de Estoque</h3>
          {estoque.map(prod => (
            <div key={prod.id} style={{ background: "#162d1f", padding: 10, marginBottom: 6, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div>{prod.descricao}</div>
                <small style={{ color: '#aaa' }}>Cód: {prod.codigo}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Estoque: <strong>{prod.estoque}</strong></div>
                <div>Preço: <strong style={{ color: '#69f0ae' }}>{fmt(prod.preco)}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======= TAB 2: SEPARAÇÃO DE PEDIDOS (NOVA) ======= */}
      {activeTab === 2 && (
        <div style={{ padding: 15, flex: 1, overflowY: "auto" }}>
          <h3>📋 Fila de Separação de Pedidos</h3>
          {pedidos.length === 0 ? (
            <p style={{ color: '#4a7c59' }}>Nenhum pedido na fila.</p>
          ) : (
            pedidos.map(ped => (
              <div key={ped.id} style={{
                background: "#162d1f", padding: 15, marginBottom: 10,
                borderRadius: 8, border: "1px solid #2e7d32"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span><strong>Pedido #{ped.id}</strong></span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold",
                    background: ped.status === "Pendente" ? "#ff9100" : ped.status === "Em Separação" ? "#2979ff" : "#00e676",
                    color: "#000"
                  }}>{ped.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "#a5d6a7" }}>
                  Data: {new Date(ped.data_criacao).toLocaleString('pt-BR')} <br />
                  Total Mód: {fmt(ped.total)}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  {ped.status === "Pendente" && (
                    <button onClick={() => alterarStatusPedido(ped.id, 'Em Separação')} style={{ flex: 1, padding: 6, background: '#2979ff', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
                      Iniciar Separação
                    </button>
                  )}
                  {ped.status === "Em Separação" && (
                    <button onClick={() => alterarStatusPedido(ped.id, 'Concluído')} style={{ flex: 1, padding: 6, background: '#00e676', border: 'none', color: '#000', borderRadius: 4, cursor: 'pointer' }}>
                      Concluir
                    </button>
                  )}
                  
                  {/* Botão para Emitir PDF de Separação */}
                  <a href={`${API_URL}/pedidos/${ped.id}/pdf`} download style={{
                    flex: 1, padding: 6, background: '#d32f2f', color: '#fff', 
                    borderRadius: 4, textAlign: 'center', textDecoration: 'none', 
                    fontWeight: 'bold', fontSize: 12
                  }}>
                    🖨️ Imprimir PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL QUANTIDADE (PRODUTO) */}
      {qtdModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#1a3a2a", padding: 20, borderRadius: 12, width: "100%", maxWidth: 300 }}>
            <h3>Qtd de {qtdModal.descricao}</h3>
            <input type="number" value={qtdTemp} onChange={e => setQtdTemp(e.target.value)} style={{ width: "90%", padding: 10, marginBottom: 10, fontSize: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setQtdModal(null)} style={{ flex: 1, padding: 10 }}>Cancelar</button>
              <button onClick={() => adicionarAoCarrinho(qtdModal, qtdTemp)} style={{ flex: 1, padding: 10, background: "#69f0ae" }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGAMENTO */}
      {modalPagto && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#1a3a2a", padding: 20, borderRadius: 12, width: "100%", maxWidth: 300 }}>
            <h3>Forma de Pagamento</h3>
            <select value={pagtoTipo} onChange={e => setPagtoTipo(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 15 }}>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão de Crédito/Débito</option>
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalPagto(false)} style={{ flex: 1, padding: 10 }}>Voltar</button>
              <button onClick={finalizarVenda} style={{ flex: 1, padding: 10, background: "#69f0ae" }}>Concluir Venda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}