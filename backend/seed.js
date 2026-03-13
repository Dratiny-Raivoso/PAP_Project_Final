/* ═══════════════════════════════════════════════════════
   LED · backend/seed.js
   Popula a base de dados com categorias e equipamentos
   Corre UMA vez com: node seed.js
═══════════════════════════════════════════════════════ */

require('dotenv').config();
const mongoose    = require('mongoose');
const Categoria   = require('./models/Categoria');
const Equipamento = require('./models/Equipamento');

/* ── Dados dos equipamentos ──────────────────────────── */
const multimedia = [
  { kit: "Kc01",      quantidade: 1, descricao: "Kit de Chroma Key c/ 5 fundos coloridos e sistema de iluminação" },
  { kit: "Mmvm01",    quantidade: 1, descricao: "Mesa de mistura de vídeo multiformato HD - Roland V-02HD" },
  { kit: "Pcv01",     quantidade: 1, descricao: "Placa de captura de video HDMI-USB" },
  { kit: "Cds01",     quantidade: 1, descricao: "Controlador Deck Stream" },
  { kit: "Mma01",     quantidade: 1, descricao: "Mesa de mistura de audio com 2 colunas Yamaha Stagepas 400BT" },
  { kit: "Mfb01",     quantidade: 1, descricao: "Máquina Fotográfica Bridge PANASONIC Lumix DC-FZ82EG-K" },
  { kit: "Mpc01",     quantidade: 1, descricao: "Microfone para câmara fotográfica (externo)" },
  { kit: "CvSONY01",  quantidade: 1, descricao: "Câmara de vídeo SONY FDR-AX53 BOSS 4K Ultra HD" },
  { kit: "Dtp01",     quantidade: 1, descricao: "Datavideo Teleponto TP-500 DSLR Prompter" },
  { kit: "Tripe01",   quantidade: 1, descricao: "Tripé Traveler BRESSER TR-688V com Cabeça Giratória" },
  { kit: "Msf01",     quantidade: 1, descricao: "Microfones sem fios - Saramonic Blink 500 B2" },
  { kit: "Mft01",     quantidade: 1, descricao: "Microfone com fios e tripé - Shure SM58 - Set" },
  { kit: "Grav01",    quantidade: 1, descricao: "Gravador de Audio - Zoom H5 c/ cartão SD de 32 GB" },
  { kit: "Mdc01",     quantidade: 1, descricao: "WACOM Mesa Digitalizadora M com Caneta 4K Intuos, Bluetooth" },
  { kit: "Impre3D01", quantidade: 1, descricao: "Impressora 3D - Blocks One MkII" },
  { kit: "Cdi3d01",   quantidade: 1, descricao: "Consumíveis diversos para impressora 3D (filamentos 1kg)" },
  { kit: "CPBCP01",   quantidade: 1, descricao: "Carregadores para Portátil Boltx0505 CLASSMATE PC" },
  { kit: "AV01",      quantidade: 1, descricao: "Auscultadores Vox505" },
  { kit: "KMSFL01",   quantidade: 1, descricao: "Kit Microfone sem fios de Lapela" },
  { kit: "SPSSDT01",  quantidade: 1, descricao: "Samsung Portable SSD T7" },
  { kit: "Usbcmd01",  quantidade: 1, descricao: "USB-C to Multiport Dock 8 in 1" },
];

const robotica = [
  { kit: "Pep01",     quantidade: 1,  descricao: "Portáteis de elevada performance" },
  { kit: "Mbik01",    quantidade: 1,  descricao: "BBC Micro:bit Inventor's Kit com Acessórios v2" },
  { kit: "KSM01",     quantidade: 1,  descricao: "KIT 37 SENSORES E ATUADORES PARA MICRO:BIT - KEYESTUDIO KS0361" },
  { kit: "Kdie01",    quantidade: 1,  descricao: "Kit de desenvolvimento e iniciação electrónica + Arduino UNO Rev3" },
  { kit: "Aunorc",    quantidade: 1,  descricao: "Arduino UNO Rev3 Compatível" },
  { kit: "Kscar01",   quantidade: 1,  descricao: "Kit de 37 sensores compatível com Arduino e Raspberry Pi" },
  { kit: "LESps01",   quantidade: 1,  descricao: "LEGO Education SPIKE Prime Set" },
  { kit: "CeK01",     quantidade: 1,  descricao: "Conjunto de expansão do kit anterior com 603 peças" },
  { kit: "KDEA01",    quantidade: 1,  descricao: "KIT DOMÓTICA EDUCACIONAL PARA ARDUINO - KEYESTUDIO KS0085" },
  { kit: "Breadb",    quantidade: 1,  descricao: "Breadboard com mínimo de 830 furos" },
  { kit: "Smp",       quantidade: 1,  descricao: "Stepper Motor de Passo" },
  { kit: "Duln",      quantidade: 1,  descricao: "Driver ULN2003 para Stepper Motor" },
  { kit: "Ledvl01",   quantidade: 5,  descricao: "LED Vermelho 5mm" },
  { kit: "Ledv01",    quantidade: 5,  descricao: "LED Verde 5mm" },
  { kit: "Leda01",    quantidade: 5,  descricao: "LED Amarelo 5mm" },
  { kit: "Sdv01",     quantidade: 2,  descricao: "Sensor de Vibração" },
  { kit: "Scf",       quantidade: 1,  descricao: "Sensor de Chama ou Fogo" },
  { kit: "Stlm",      quantidade: 1,  descricao: "Sensor de Temperatura LM35" },
  { kit: "Riir",      quantidade: 1,  descricao: "Recetor de Infravermelhos IR" },
  { kit: "Slldr01",   quantidade: 3,  descricao: "Sensor de Luz LDR" },
  { kit: "Cbp01",     quantidade: 4,  descricao: "Cápsula para Botão de Pressão" },
  { kit: "Bp01",      quantidade: 4,  descricao: "Botão de Pressão" },
  { kit: "Pl10k",     quantidade: 1,  descricao: "Potenciómetro Linear 10K" },
  { kit: "Buzzp",     quantidade: 1,  descricao: "Buzzer Passivo (piezo buzzer)" },
  { kit: "Buzza",     quantidade: 1,  descricao: "Buzzer Ativo (tone generator)" },
  { kit: "Ciir",      quantidade: 1,  descricao: "Comando Infravermelho IR" },
  { kit: "Dlcd",      quantidade: 1,  descricao: "Display LCD 16x02" },
  { kit: "Sm90",      quantidade: 1,  descricao: "Servo Motor SG90" },
  { kit: "Mled",      quantidade: 1,  descricao: "Matriz LED 8x8" },
  { kit: "Dled7s1d",  quantidade: 1,  descricao: "Display LED 7 Segmentos de 1 Dígito" },
  { kit: "Dled7s4d",  quantidade: 1,  descricao: "Display LED 7 Segmentos de 4 Dígitos" },
  { kit: "Rohm01",    quantidade: 10, descricao: "Resistência 220 Ohm" },
  { kit: "Rohm1k01",  quantidade: 10, descricao: "Resistência 1K Ohm" },
  { kit: "Rohm10k01", quantidade: 10, descricao: "Resistência 10K Ohm" },
  { kit: "Cljmmb01",  quantidade: 30, descricao: "Cabos de Ligação Jumper Macho-Macho para Breadboard" },
  { kit: "Clbmf01",   quantidade: 10, descricao: "Cabos de Ligação Jumper para Breadboard Macho-Fêmea" },
  { kit: "Caixa01",   quantidade: 1,  descricao: "Caixa de equipamentos de Programação e Robótica PR.FT7_5" },
  { kit: "Caixa02",   quantidade: 1,  descricao: "Caixa de equipamentos de Programação e Robótica PR.FT8_5" },
  { kit: "Caixa03",   quantidade: 1,  descricao: "Caixa de equipamentos de Programação e Robótica PR.FT9_5" },
  { kit: "Caixa04",   quantidade: 1,  descricao: "Caixa de equipamentos de Programação e Robótica PR.FT10_10" },
  { kit: "Caixa05",   quantidade: 1,  descricao: "Caixa de equipamentos de Programação e Robótica PR.FT11_5" },
  { kit: "PdCp",      quantidade: 1,  descricao: "Placa de Control principal (compatível com Arduino UNO Rev3)" },
  { kit: "Emsc",      quantidade: 1,  descricao: "Estrutura em madeira de simulação de uma casa" },
  { kit: "MB",        quantidade: 1,  descricao: "Módulo Bluetooth (DX-BT24)" },
  { kit: "Msm",       quantidade: 2,  descricao: "Módulo servo motor" },
  { kit: "Md",        quantidade: 1,  descricao: "Módulo display LCD 1602" },
];

const stem = [
  { kit: "Mek01",     quantidade: 1, descricao: "Mbot Explorer Kit Makeblock com Display" },
  { kit: "BatMbot01", quantidade: 1, descricao: "Bateria de lítio para MBot" },
  { kit: "Mbss01",    quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Som" },
  { kit: "Mbsg01",    quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Gás" },
  { kit: "Mbsth01",   quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Temperatura e humidade" },
  { kit: "Mbsc01",    quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Cor" },
  { kit: "Mbsts01",   quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Temperatura submergível" },
  { kit: "Mbsm01",    quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Movimento" },
  { kit: "Mbsl01",    quantidade: 1, descricao: "Makeblock (Mbot) módulo sensor de Luz" },
  { kit: "Micro01",   quantidade: 1, descricao: "Microscópio B-190TB c/ câmara digital" },
  { kit: "Opcm01",    quantidade: 1, descricao: "Optika Câmera C-B1, 1.3 MP, USB2.0" },
  { kit: "Tiib01",    quantidade: 1, descricao: "TI-Innovator Hub com TI LaunchPad Board" },
  { kit: "Tiir01",    quantidade: 1, descricao: "TI-Innovator Rover" },
  { kit: "Ler01",     quantidade: 1, descricao: "Laboratório Energias Renováveis" },
  { kit: "Titec01",   quantidade: 1, descricao: "TI-Innovator Technology" },
];

/* ── Função principal ────────────────────────────────── */
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB ligado');

    // Limpar dados antigos
    await Categoria.deleteMany({});
    await Equipamento.deleteMany({});
    console.log('🗑️  Dados antigos apagados');

    // Criar categorias
    const cats = await Categoria.insertMany([
      { nome: 'Multimédia',       icone: '🎬', cor: '#E0176E' },
      { nome: 'Prog. & Robótica', icone: '🤖', cor: '#4DB84B' },
      { nome: 'STEM',             icone: '🔬', cor: '#3BB5E8' },
    ]);
    console.log('📁 3 categorias inseridas');

    const idMM  = cats[0]._id;
    const idRob = cats[1]._id;
    const idSTEM = cats[2]._id;

    // Juntar categoriaId a cada equipamento
    const todos = [
      ...multimedia.map(e => ({ ...e, categoriaId: idMM,   quantidadeDisponivel: e.quantidade, estado: 'disponivel' })),
      ...robotica.map(e  => ({ ...e, categoriaId: idRob,  quantidadeDisponivel: e.quantidade, estado: 'disponivel' })),
      ...stem.map(e      => ({ ...e, categoriaId: idSTEM, quantidadeDisponivel: e.quantidade, estado: 'disponivel' })),
    ];

    await Equipamento.insertMany(todos);
    console.log(`📦 ${todos.length} equipamentos inseridos`);

    console.log('🎉 Base de dados populada com sucesso!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

seed();