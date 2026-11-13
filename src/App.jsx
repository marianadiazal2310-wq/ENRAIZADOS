import { demoProducts } from "./data/products";
import {useEffect,useMemo,useState} from "react";
import {
  Leaf,ShoppingBag,Search,Menu,X,Plus,Minus,Trash2,
  MessageCircle,Send,ArrowRight,CheckCircle2,Sprout,
  Lock,LogOut,Edit,Save,Package
} from "lucide-react";

import {demoProducts} from "./data/products";

import {
  getProducts,sendContact,askAssistant,adminLogin,
  createProduct,updateProduct,deleteProduct
} from "./services/api";

const money=n=>new Intl.NumberFormat("es-CO",{
  style:"currency",
  currency:"COP",
  maximumFractionDigits:0
}).format(n||0);

const emptyProduct={
  name:"",
  artisan:"",
  category:"",
  price:"",
  description:"",
  material:"",
  image:"/images/bolso-iraca.svg",
  stock:0
};

export default function App(){

  const [products,setProducts]=useState(demoProducts);

  const [cart,setCart]=useState(()=>{
    try{
      return JSON.parse(localStorage.getItem("enraizados-cart")||"[]");
    }catch{
      return [];
    }
  });

  const [cartOpen,setCartOpen]=useState(false);
  const [assistantOpen,setAssistantOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("Todos");
  const [notice,setNotice]=useState("");

  const [messages,setMessages]=useState([
    {
      role:"assistant",
      content:"¡Hola! Soy Raíz, el asistente de ENRAIZADOS. 🌿 Puedo ayudarte a descubrir artesanías, conocer sus materiales y elegir un regalo. ¿Qué te gustaría encontrar?"
    }
  ]);

  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);

  const [contact,setContact]=useState({
    name:"",
    email:"",
    message:""
  });

  const [contactState,setContactState]=useState("");

  // ADMINISTRACIÓN
  const [adminOpen,setAdminOpen]=useState(false);
  const [adminToken,setAdminToken]=useState("");
  const [adminEmail,setAdminEmail]=useState("");
  const [adminPassword,setAdminPassword]=useState("");
  const [adminName,setAdminName]=useState("");
  const [adminError,setAdminError]=useState("");
  const [adminMode,setAdminMode]=useState("login");
  const [editingId,setEditingId]=useState(null);
  const [adminProduct,setAdminProduct]=useState(emptyProduct);

  useEffect(()=>{
    getProducts()
      .then(d=>{
        if(d.products?.length){
          setProducts(d.products);
        }
      })
      .catch(()=>{});
  },[]);

  useEffect(()=>{
    localStorage.setItem("enraizados-cart",JSON.stringify(cart));
  },[cart]);

  const count=cart.reduce((s,i)=>s+i.quantity,0);
  const total=cart.reduce((s,i)=>s+i.price*i.quantity,0);

  const categories=[
    "Todos",
    ...new Set(products.map(p=>p.category))
  ];

  const filtered=useMemo(
    ()=>products.filter(p=>
      (category==="Todos"||p.category===category)&&
      (`${p.name} ${p.material} ${p.artisan}`)
        .toLowerCase()
        .includes(search.toLowerCase())
    ),
    [products,category,search]
  );

  function showNotice(message){
    setNotice(message);
    setTimeout(()=>setNotice(""),2500);
  }

  function add(p){
    setCart(old=>{
      const found=old.find(i=>i._id===p._id);

      return found
        ?old.map(i=>i._id===p._id
          ?{...i,quantity:Math.min(i.quantity+1,p.stock||99)}
          :i)
        :[...old,{...p,quantity:1}];
    });

    showNotice("Producto agregado al carrito");
  }

  const qty=(id,d)=>
    setCart(old=>
      old.map(i=>i._id===id
        ?{...i,quantity:i.quantity+d}
        :i
      ).filter(i=>i.quantity>0)
    );

  const remove=id=>
    setCart(old=>old.filter(i=>i._id!==id));

  async function chat(e){
    e.preventDefault();

    const text=chatInput.trim();

    if(!text||chatLoading)return;

    const next=[
      ...messages,
      {role:"user",content:text}
    ];

    setMessages(next);
    setChatInput("");
    setChatLoading(true);

    try{
      const d=await askAssistant(text,next.slice(-8));

      setMessages(v=>[
        ...v,
        {role:"assistant",content:d.reply}
      ]);
    }catch{
      setMessages(v=>[
        ...v,
        {
          role:"assistant",
          content:"Aún no puedo conectarme al servicio de IA. El administrador debe configurar OPENAI_API_KEY en el archivo .env del servidor. Mientras tanto puedes explorar el catálogo."
        }
      ]);
    }finally{
      setChatLoading(false);
    }
  }

  // INICIAR SESIÓN ADMINISTRADOR
  async function handleAdminLogin(e){
    e.preventDefault();
    setAdminError("");

    try{
      const data=await adminLogin(adminEmail,adminPassword);

      setAdminToken(data.token);
      setAdminName(data.admin.name);
      setAdminPassword("");
      setAdminMode("products");

      showNotice("Bienvenido al panel de administración");
    }catch(error){
      setAdminError(error.message||"No se pudo iniciar sesión");
    }
  }

  function resetAdminForm(){
    setAdminProduct({...emptyProduct});
    setEditingId(null);
  }

  // CREAR O ACTUALIZAR PRODUCTO
  async function saveAdminProduct(e){
    e.preventDefault();
    setAdminError("");

    try{
      const payload={
        ...adminProduct,
        price:Number(adminProduct.price),
        stock:Number(adminProduct.stock)
      };

      if(editingId){
        await updateProduct(editingId,payload,adminToken);
      }else{
        await createProduct(payload,adminToken);
      }

      const data=await getProducts();

      setProducts(data.products||[]);
      resetAdminForm();

      showNotice(editingId
        ?"Producto actualizado correctamente"
        :"Producto agregado correctamente"
      );

    }catch(error){
      setAdminError(error.message||"No se pudo guardar el producto");
    }
  }

  // DESACTIVAR PRODUCTO
  async function removeAdminProduct(id){
    if(!window.confirm("¿Deseas desactivar este producto?"))return;

    try{
      await deleteProduct(id,adminToken);

      getProducts()
  .then(d => {
    if (d.products?.length) {
      setProducts(d.products);
    } else {
      setProducts(demoProducts);
    }
  })
  .catch(() => {
    setProducts(demoProducts);
  });
 [];

      setProducts(data.products||[]);
      resetAdminForm();

      showNotice("Producto desactivado correctamente");

    }catch(error){
      setAdminError(error.message||"No se pudo desactivar el producto");
    }
  }

  // EDITAR PRODUCTO
  function editAdminProduct(product){
    setAdminProduct({
      name:product.name||"",
      artisan:product.artisan||"",
      category:product.category||"",
      price:product.price||"",
      description:product.description||"",
      material:product.material||"",
      image:product.image||"/images/bolso-iraca.svg",
      stock:product.stock||0
    });

    setEditingId(product._id);
    setAdminError("");

    window.scrollTo({top:0,behavior:"smooth"});
  }

  function logoutAdmin(){
    setAdminToken("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminMode("login");
    setAdminError("");
    resetAdminForm();
  }

  // CONTACTO
  async function contactSubmit(e){
    e.preventDefault();
    setContactState("sending");

    try{
      await sendContact(contact);

      setContactState("sent");

      setContact({
        name:"",
        email:"",
        message:""
      });
    }catch{
      setContactState("error");
    }
  }

  return(
    <div>

      {/* ENCABEZADO */}
      <header className="header">

        <a className="brand" href="#inicio">
          <span className="brand-icon"><Leaf/></span>
          <span>
            ENRAIZADOS
            <small>ARTESANÍA CON IDENTIDAD</small>
          </span>
        </a>

        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#historia">Nuestra esencia</a>
          <a href="#catalogo">Artesanías</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="head-actions">

          <button
            type="button"
            className="admin-access"
            onClick={()=>{
              setAdminOpen(true);
              setAdminError("");
            }}
            title="Administración"
            aria-label="Administración"
            style={{
              display:"inline-flex",
              alignItems:"center",
              gap:"7px",
              padding:"10px 14px",
              background:"#76283f",
              color:"#fff",
              border:"1px solid #c6a15b",
              borderRadius:"8px",
              cursor:"pointer",
              visibility:"visible",
              opacity:1
            }}
          >
            <Lock size={17}/>
            <span>ADMIN
            </span>
          </button>
          

          <button
            className="cart-button"
            onClick={()=>setCartOpen(true)}
            aria-label="Abrir carrito"
          >
            <ShoppingBag/>
            <b>{count}</b>
          </button>

          <button
            className="mobile-menu"
            onClick={()=>
              document.querySelector(".mobile-links")
                ?.classList.toggle("show")
            }
          >
            <Menu/>
          </button>

        </div>
      </header>


      <div className="mobile-links">
        <a href="#inicio">Inicio</a>
        <a href="#historia">Nuestra esencia</a>
        <a href="#catalogo">Artesanías</a>
        <a href="#contacto">Contacto</a>
      </div>

      <main>

        {/* PORTADA */}
        <section className="hero" id="inicio">

          <div className="hero-copy">

            <span className="eyebrow">
              <Sprout size={15}/>
              HECHO A MANO, CON RAÍCES
            </span>

            <h1>
              Historias que<br/>
              <em>se tejen</em> con las manos.
            </h1>

            <p>
              Conectamos el talento de nuestros artesanos con personas que valoran la tradición, los materiales responsables y el comercio justo.
            </p>

            <a className="primary-btn" href="#catalogo">
              Descubrir artesanías
              <ArrowRight size={17}/>
            </a>

            <div className="hero-note">
              ✳ Cada pieza tiene una historia que contar.
            </div>

          </div>

          <div className="hero-art">
            <img
              src="/images/hero-artesania.svg"
              alt="Artesanías y fibras naturales"
            />
            <div className="round-stamp">
              TRADICIÓN<br/>VIVA ✳
            </div>
          </div>

        </section>

        {/* VALORES */}
        <section className="values">

          <div>
            <span>01</span>
            <h3>Comercio justo</h3>
            <p>Relaciones directas que reconocen el trabajo artesanal.</p>
          </div>

          <div>
            <span>02</span>
            <h3>Raíces auténticas</h3>
            <p>Técnicas y saberes que pasan de generación en generación.</p>
          </div>

          <div>
            <span>03</span>
            <h3>Materiales responsables</h3>
            <p>Fibras naturales, recicladas y de origen vegetal.</p>
          </div>

        </section>

        {/* HISTORIA */}
        <section className="intro section" id="historia">

          <div className="intro-art">
            <img
              src="/images/taller-artesanal.svg"
              alt="Taller artesanal"
            />
          </div>

          <div>
            <span className="eyebrow">NUESTRA ESENCIA</span>

            <h2>
              Las manos crean.<br/>
              <em>La tradición permanece.</em>
            </h2>

            <p>
              ENRAIZADOS nace para acercar a artesanos tradicionales y compradores, reduciendo intermediarios y promoviendo el reconocimiento del trabajo hecho a mano.
            </p>

            <p>
              Creemos en una economía más consciente, donde cada compra apoya historias, comunidades y oficios.
            </p>

            <a className="text-link" href="#catalogo">
              Conoce las piezas <ArrowRight size={16}/>
            </a>
          </div>

        </section>

        {/* CATÁLOGO */}
        <section className="catalog section" id="catalogo">

          <div className="section-heading">

            <div>
              <span className="eyebrow">SELECCIÓN ARTESANAL</span>
              <h2>Piezas con <em>alma propia.</em></h2>
              <p>Encuentra objetos únicos elaborados con dedicación.</p>
            </div>

            <div className="searchbox">
              <Search size={17}/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar artesanías..."
              />
            </div>

          </div>

          <div className="filters">
            {categories.map(c=>(
              <button
                key={c}
                className={category===c?"active":""}
                onClick={()=>setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="products">

            {filtered.map(p=>(
              <article className="product-card" key={p._id}>

                <div className="product-image">
                  <img
                    src={p.image||"/images/bolso-iraca.svg"}
                    alt={p.name}
                  />

                  <span className="product-tag">
                    Hecho a mano
                  </span>

                  <button
                    className="quick-add"
                    onClick={()=>add(p)}
                    aria-label={`Agregar ${p.name}`}
                  >
                    <Plus/>
                  </button>
                </div>

                <div className="product-info">

                  <span className="product-category">
                    {p.category} · {p.material}
                  </span>

                  <h3>{p.name}</h3>

                  <p>{p.description}</p>

                  <div className="product-bottom">
                    <strong>{money(p.price)}</strong>

                    <button onClick={()=>add(p)}>
                      Agregar <ShoppingBag size={15}/>
                    </button>
                  </div>

                  <small className="artisan">
                    Por {p.artisan}
                  </small>

                </div>
              </article>
            ))}

          </div>

          {!filtered.length&&(
            <p className="empty">
              No encontramos productos con esa búsqueda.
            </p>
          )}

        </section>

        {/* MENSAJE DE IMPACTO */}
        <section className="artisan-banner">

          <div>
            <span className="eyebrow">
              CADA COMPRA TIENE UN IMPACTO
            </span>

            <h2>
              Apoyar el arte local<br/>
              <em>también es cuidar nuestras raíces.</em>
            </h2>

            <p>
              Detrás de cada pieza hay conocimiento, dedicación y una comunidad.
            </p>
          </div>

          <div className="banner-leaf">
            <Leaf size={90}/>
          </div>

        </section>

        {/* CONTACTO */}
        <section className="contact section" id="contacto">

          <div>

            <span className="eyebrow">HABLEMOS</span>

            <h2>
              ¿Tienes alguna <em>pregunta?</em>
            </h2>

            <p>
              Escríbenos para conocer más sobre las piezas, sus materiales o nuestros artesanos.
            </p>

            <div className="contact-detail">
              <Leaf/>
              <span>Tradición, comunidad y comercio consciente.</span>
            </div>

            <div className="contact-detail">
              <span>☎</span>
              <a href="tel:+573249216558">324 921 6558</a>
            </div>

            <div className="contact-detail">
              <span>✉</span>
              <a href="mailto:artesaniasenraizados@gmail.com">
                artesaniasenraizados@gmail.com
              </a>
            </div>

          </div>

          <form className="contact-form" onSubmit={contactSubmit}>

            <label>
              Nombre
              <input
                required
                value={contact.name}
                onChange={e=>setContact({...contact,name:e.target.value})}
                placeholder="Tu nombre"
              />
            </label>

            <label>
              Correo electrónico
              <input
                required
                type="email"
                value={contact.email}
                onChange={e=>setContact({...contact,email:e.target.value})}
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label>
              Mensaje
              <textarea
                required
                rows="4"
                value={contact.message}
                onChange={e=>setContact({...contact,message:e.target.value})}
                placeholder="¿En qué podemos ayudarte?"
              />
            </label>

            <button
              className="primary-btn"
              disabled={contactState==="sending"}
            >
              Enviar mensaje <ArrowRight size={16}/>
            </button>

            {contactState==="sent"&&(
              <small className="success">
                ¡Mensaje registrado correctamente!
              </small>
            )}

            {contactState==="error"&&(
              <small className="error">
                No se pudo enviar. Comprueba que el servidor y MongoDB estén conectados.
              </small>
            )}

          </form>

        </section>

      </main>

      {/* PIE DE PÁGINA */}
      <footer>

        <a className="brand footer-brand" href="#inicio">
          <span className="brand-icon"><Leaf/></span>
          <span>
            ENRAIZADOS
            <small>ARTESANÍA CON IDENTIDAD</small>
          </span>
        </a>

        <p>
          Honramos las manos que mantienen viva la tradición.
        </p>

        <small>© 2026 ENRAIZADOS · Proyecto académico</small>

      </footer>

      {/* AVISO */}
      {notice&&(
        <div className="toast">
          <CheckCircle2 size={17}/>
          {notice}
        </div>
      )}

      {/* CARRITO */}
      {cartOpen&&(
        <div
          className="overlay"
          onMouseDown={e=>{
            if(e.target===e.currentTarget)setCartOpen(false);
          }}
        >
          <aside className="drawer">

            <div className="drawer-head">
              <div>
                <span className="eyebrow">TU SELECCIÓN</span>
                <h2>Mi carrito ({count})</h2>
              </div>

              <button
                className="close-btn"
                onClick={()=>setCartOpen(false)}
              >
                <X/>
              </button>
            </div>

            {!cart.length?(
              <div className="empty-cart">
                <ShoppingBag size={42}/>
                <h3>Tu carrito está esperando.</h3>
                <p>Explora nuestras piezas y agrega tus favoritas.</p>

                <button
                  className="primary-btn"
                  onClick={()=>setCartOpen(false)}
                >
                  Ver artesanías
                </button>
              </div>
            ):(
              <>
                <div className="cart-items">

                  {cart.map(i=>(
                    <div className="cart-item" key={i._id}>

                      <img
                        src={i.image||"/images/bolso-iraca.svg"}
                        alt=""
                      />

                      <div className="cart-item-info">
                        <h3>{i.name}</h3>
                        <strong>{money(i.price)}</strong>

                        <div className="qty">
                          <button onClick={()=>qty(i._id,-1)}>
                            <Minus size={13}/>
                          </button>

                          <span>{i.quantity}</span>

                          <button onClick={()=>qty(i._id,1)}>
                            <Plus size={13}/>
                          </button>
                        </div>
                      </div>

                      <button
                        className="remove"
                        onClick={()=>remove(i._id)}
                      >
                        <Trash2 size={17}/>
                      </button>

                    </div>
                  ))}

                </div>

                <div className="cart-summary">

                  <div>
                    <span>Subtotal</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <small>
                    El envío se coordinará al confirmar el pedido.
                  </small>

                  <button
                    className="primary-btn"
                    onClick={()=>{
                      setCartOpen(false);

                      setContact(v=>({
                        ...v,
                        message:"Hola, quisiera información para realizar este pedido: "+
                          cart.map(i=>`${i.quantity} x ${i.name}`).join(", ")+
                          ". Total: "+money(total)
                      }));

                      document.querySelector("#contacto")
                        ?.scrollIntoView({behavior:"smooth"});
                    }}
                  >
                    Consultar pedido <ArrowRight size={16}/>
                  </button>

                </div>
              </>
            )}

          </aside>
        </div>
      )}

      {/* ASISTENTE IA */}
      <button
        className="assistant-fab"
        onClick={()=>setAssistantOpen(!assistantOpen)}
      >
        <MessageCircle/>
        <span>Asistente IA</span>
      </button>

      {assistantOpen&&(
        <section className="chat-panel">

          <div className="chat-head">

            <div className="chat-avatar">
              <Leaf/>
            </div>

            <div>
              <strong>Raíz · Asistente ENRAIZADOS</strong>
              <small><i/> Aquí para ayudarte</small>
            </div>

            <button onClick={()=>setAssistantOpen(false)}>
              <X/>
            </button>

          </div>

          <div className="chat-messages">

            {messages.map((m,i)=>(
              <div
                key={i}
                className={`chat-bubble ${m.role}`}
              >
                {m.content}
              </div>
            ))}

            {chatLoading&&(
              <div className="chat-bubble assistant">
                Estoy pensando…
              </div>
            )}

          </div>

          <form className="chat-form" onSubmit={chat}>

            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              placeholder="Pregunta por una artesanía..."
            />

            <button disabled={chatLoading||!chatInput.trim()}>
              <Send size={17}/>
            </button>

          </form>

          <small className="chat-foot">
            Para activar respuestas reales de IA, configura la clave privada en el .env del servidor.
          </small>

        </section>
      )}

      {/* PANEL ADMINISTRADOR */}
      {adminOpen&&(
        <div
          className="overlay admin-overlay"
          onMouseDown={e=>{
            if(e.target===e.currentTarget)setAdminOpen(false);
          }}
          style={{
            position:"fixed",
            inset:0,
            zIndex:9999,
            background:"rgba(20,12,15,.75)",
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            padding:"18px",
            overflowY:"auto"
          }}
        >

          <section
            style={{
              background:"#fffaf5",
              color:"#302329",
              width:"100%",
              maxWidth:"850px",
              maxHeight:"90vh",
              overflowY:"auto",
              borderRadius:"16px",
              padding:"25px",
              boxShadow:"0 20px 60px rgba(0,0,0,.3)"
            }}
          >

            <div style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
              gap:"12px",
              borderBottom:"1px solid #e5d6cc",
              paddingBottom:"15px",
              marginBottom:"20px"
            }}>

              <div>
                <span style={{
                  color:"#8b455b",
                  fontSize:"12px",
                  letterSpacing:"2px",
                  fontWeight:"bold"
                }}>
                  ENRAIZADOS
                </span>

                <h2 style={{margin:"5px 0"}}>
                  <Lock size={19} style={{verticalAlign:"middle"}}/>
                  {" "}Administración
                </h2>
              </div>

              <button
                onClick={()=>setAdminOpen(false)}
                style={{
                  border:0,
                  background:"transparent",
                  cursor:"pointer",
                  color:"#76283f"
                }}
              >
                <X size={25}/>
              </button>

            </div>

            {!adminToken?(
              <div style={{
                maxWidth:"420px",
                margin:"20px auto"
              }}>

                <h3>Acceso administrador</h3>

                <p>
                  Ingresa con las credenciales privadas del administrador de ENRAIZADOS.
                </p>

                <form
                  onSubmit={handleAdminLogin}
                  style={{
                    display:"grid",
                    gap:"14px"
                  }}
                >

                  <label>
                    Correo electrónico

                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e=>setAdminEmail(e.target.value)}
                      placeholder="Correo del administrador"
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Contraseña

                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={e=>setAdminPassword(e.target.value)}
                      placeholder="Contraseña"
                      style={adminInputStyle}
                    />
                  </label>

                  {adminError&&(
                    <p style={{color:"#b42318"}}>
                      {adminError}
                    </p>
                  )}

                  <button
                    type="submit"
                    style={adminButtonStyle}
                  >
                    <Lock size={17}/>
                    Iniciar sesión
                  </button>

                </form>

                <p style={{
                  fontSize:"12px",
                  color:"#806c72",
                  marginTop:"18px"
                }}>
                  Acceso exclusivo para el administrador.
                </p>

              </div>
            ):(
              <div>

                <div style={{
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center",
                  flexWrap:"wrap",
                  gap:"12px",
                  marginBottom:"20px"
                }}>

                  <div>
                    <h3 style={{margin:"0 0 5px"}}>
                      Bienvenido, {adminName}
                    </h3>
                    <span style={{fontSize:"13px",color:"#806c72"}}>
                      Gestiona los productos de tu tienda.
                    </span>
                  </div>

                  <button
                    onClick={logoutAdmin}
                    style={{
                      ...adminButtonStyle,
                      background:"#49333b"
                    }}
                  >
                    <LogOut size={16}/>
                    Cerrar sesión
                  </button>

                </div>

                <div style={{
                  background:"#f1e5e2",
                  padding:"15px",
                  borderRadius:"10px",
                  marginBottom:"22px"
                }}>
                  <h3 style={{margin:"0 0 5px"}}>
                    <Package size={19} style={{verticalAlign:"middle"}}/>
                    {" "}Gestión de productos
                  </h3>
                  <p style={{margin:0,fontSize:"13px"}}>
                    Agrega, modifica o desactiva artesanías del catálogo.
                  </p>
                </div>

                <form
                  onSubmit={saveAdminProduct}
                  style={{
                    display:"grid",
                    gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",
                    gap:"13px",
                    marginBottom:"25px"
                  }}
                >

                  <label>
                    Nombre del producto
                    <input
                      required
                      value={adminProduct.name}
                      onChange={e=>setAdminProduct({...adminProduct,name:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Artesano
                    <input
                      required
                      value={adminProduct.artisan}
                      onChange={e=>setAdminProduct({...adminProduct,artisan:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Categoría
                    <input
                      required
                      value={adminProduct.category}
                      onChange={e=>setAdminProduct({...adminProduct,category:e.target.value})}
                      placeholder="Bolsos, decoración..."
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Material
                    <input
                      required
                      value={adminProduct.material}
                      onChange={e=>setAdminProduct({...adminProduct,material:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Precio (COP)
                    <input
                      required
                      type="number"
                      min="0"
                      value={adminProduct.price}
                      onChange={e=>setAdminProduct({...adminProduct,price:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label>
                    Existencias
                    <input
                      type="number"
                      min="0"
                      value={adminProduct.stock}
                      onChange={e=>setAdminProduct({...adminProduct,stock:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label style={{gridColumn:"1 / -1"}}>
                    Descripción
                    <textarea
                      required
                      rows="3"
                      value={adminProduct.description}
                      onChange={e=>setAdminProduct({...adminProduct,description:e.target.value})}
                      style={adminInputStyle}
                    />
                  </label>

                  <label style={{gridColumn:"1 / -1"}}>
                    Ruta de imagen
                    <input
                      value={adminProduct.image}
                      onChange={e=>setAdminProduct({...adminProduct,image:e.target.value})}
                      placeholder="/images/mi-producto.svg"
                      style={adminInputStyle}
                    />
                  </label>

                  {adminError&&(
                    <p style={{
                      color:"#b42318",
                      gridColumn:"1 / -1"
                    }}>
                      {adminError}
                    </p>
                  )}

                  <div style={{
                    display:"flex",
                    gap:"10px",
                    flexWrap:"wrap",
                    gridColumn:"1 / -1"
                  }}>

                    <button
                      type="submit"
                      style={adminButtonStyle}
                    >
                      <Save size={17}/>
                      {editingId?"Guardar cambios":"Agregar producto"}
                    </button>

                    <button
                      type="button"
                      onClick={resetAdminForm}
                      style={{
                        ...adminButtonStyle,
                        background:"#8c777d"
                      }}
                    >
                      Limpiar formulario
                    </button>

                  </div>

                </form>

                <h3>Productos registrados ({products.length})</h3>

                <div style={{
                  display:"grid",
                  gap:"10px"
                }}>

                  {products.map(product=>(
                    <div
                      key={product._id}
                      style={{
                        display:"flex",
                        alignItems:"center",
                        gap:"12px",
                        flexWrap:"wrap",
                        padding:"12px",
                        border:"1px solid #e5d6cc",
                        borderRadius:"10px"
                      }}
                    >

                      <img
                        src={product.image||"/images/bolso-iraca.svg"}
                        alt={product.name}
                        style={{
                          width:"60px",
                          height:"60px",
                          objectFit:"cover",
                          borderRadius:"8px"
                        }}
                      />

                      <div style={{flex:1,minWidth:"130px"}}>
                        <strong>{product.name}</strong>
                        <div style={{fontSize:"13px",color:"#806c72"}}>
                          {product.category} · {money(product.price)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={()=>editAdminProduct(product)}
                        style={smallAdminButton}
                      >
                        <Edit size={15}/>
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={()=>removeAdminProduct(product._id)}
                        style={{
                          ...smallAdminButton,
                          background:"#9e3944"
                        }}
                      >
                        <Trash2 size={15}/>
                        Desactivar
                      </button>

                    </div>
                  ))}

                </div>

              </div>
            )}

          </section>
        </div>
      )}

    </div>
  );
}

const adminInputStyle={
  display:"block",
  width:"100%",
  boxSizing:"border-box",
  padding:"11px",
  marginTop:"6px",
  border:"1px solid #d9c5c4",
  borderRadius:"7px",
  background:"#fff",
  color:"#302329",
  font:"inherit"
};

const adminButtonStyle={
  display:"inline-flex",
  alignItems:"center",
  justifyContent:"center",
  gap:"8px",
  padding:"11px 16px",
  border:0,
  borderRadius:"7px",
  background:"#76283f",
  color:"#fff",
  cursor:"pointer",
  fontWeight:"bold"
};

const smallAdminButton={
  display:"inline-flex",
  alignItems:"center",
  gap:"5px",
  padding:"8px 10px",
  border:0,
  borderRadius:"6px",
  background:"#76283f",
  color:"#fff",
  cursor:"pointer"
};
