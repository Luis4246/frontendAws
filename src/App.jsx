import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://54.82.36.171:8000/api";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [usuario, setUsuario] = useState(null);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  const [vistaCliente, setVistaCliente] = useState("productos");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
  });

  const getToken = () => localStorage.getItem("access");

  const axiosAuth = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const cargarProductos = async () => {
    try {
      const response = await axios.get(`${API_URL}/productos/`, axiosAuth());
      setProductos(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    try {
      const response = await axios.post(`${API_URL}/login/`, {
        username,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      const perfil = await axios.get(`${API_URL}/perfil/`, {
        headers: {
          Authorization: `Bearer ${response.data.access}`,
        },
      });

      setUsuario(perfil.data);
      await cargarProductos();
    } catch (error) {
      console.error(error);
      setError("Usuario o contraseña incorrectos");
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setUsuario(null);
    setUsername("");
    setPassword("");
    setProductos([]);
    setCarrito([]);
    setVistaCliente("productos");
    setError("");
    setMensaje("");
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      await axios.post(`${API_URL}/productos/`, nuevoProducto, axiosAuth());

      setNuevoProducto({
        nombre: "",
        descripcion: "",
        precio: "",
        stock: "",
      });

      setMensaje("Producto creado correctamente");
      await cargarProductos();
    } catch (error) {
      console.error(error);
      setError("No se pudo crear el producto");
    }
  };

  const agregarAlCarrito = (producto) => {
    setMensaje("");
    setError("");

    const existe = carrito.find((item) => item.id === producto.id);

    if (existe) {
      if (existe.cantidad >= producto.stock) {
        setError("No puedes agregar más unidades que el stock disponible");
        return;
      }

      setCarrito(
        carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      if (producto.stock <= 0) {
        setError("Este producto no tiene stock disponible");
        return;
      }

      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const disminuirCantidad = (productoId) => {
    setMensaje("");
    setError("");

    setCarrito(
      carrito
        .map((item) =>
          item.id === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito(carrito.filter((item) => item.id !== productoId));
  };

  const totalCarrito = carrito.reduce(
    (total, item) => total + Number(item.precio) * item.cantidad,
    0
  );

  const confirmarPedido = async () => {
    setError("");
    setMensaje("");

    if (carrito.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    try {
      const detalles = carrito.map((item) => ({
        producto: item.id,
        cantidad: item.cantidad,
      }));

      await axios.post(`${API_URL}/pedidos/`, { detalles }, axiosAuth());

      setCarrito([]);
      setVistaCliente("productos");
      setMensaje("Pedido confirmado correctamente. Revisa tu correo.");

      await cargarProductos();
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || "No se pudo confirmar el pedido");
    }
  };

  useEffect(() => {
    const token = getToken();

    if (!token) return;

    axios
      .get(`${API_URL}/perfil/`, axiosAuth())
      .then((response) => {
        setUsuario(response.data);
        cargarProductos();
      })
      .catch(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      });
  }, []);

  if (!usuario) {
    return (
      <div className="bg-dark min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow p-4" style={{ width: "420px" }}>
          <h2 className="text-center mb-4">Ecommerce AWS</h2>
          <p className="text-center text-muted">Inicia sesión para continuar</p>

          <form onSubmit={login}>
            <div className="mb-3">
              <label className="form-label">Usuario</label>
              <input
                className="form-control"
                type="text"
                placeholder="Ej: cliente1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                className="form-control"
                type="password"
                placeholder="Ej: 123456"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn btn-primary w-100">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">Ecommerce AWS</span>

        <div className="d-flex align-items-center gap-3">
          <span className="text-white">
            {usuario.username} | {usuario.rol}
          </span>

          <button className="btn btn-outline-light" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="container py-4">
        {usuario.rol === "operador" ? (
          <PanelOperador
            usuario={usuario}
            productos={productos}
            nuevoProducto={nuevoProducto}
            setNuevoProducto={setNuevoProducto}
            crearProducto={crearProducto}
            mensaje={mensaje}
            error={error}
          />
        ) : (
          <PanelCliente
            usuario={usuario}
            productos={productos}
            carrito={carrito}
            agregarAlCarrito={agregarAlCarrito}
            disminuirCantidad={disminuirCantidad}
            quitarDelCarrito={quitarDelCarrito}
            totalCarrito={totalCarrito}
            vistaCliente={vistaCliente}
            setVistaCliente={setVistaCliente}
            confirmarPedido={confirmarPedido}
            mensaje={mensaje}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function PanelCliente({
  usuario,
  productos,
  carrito,
  agregarAlCarrito,
  disminuirCantidad,
  quitarDelCarrito,
  totalCarrito,
  vistaCliente,
  setVistaCliente,
  confirmarPedido,
  mensaje,
  error,
}) {
  return (
    <>
      <div className="card shadow-sm p-4 mb-4 text-center">
        <h1>Panel Cliente</h1>

        <p className="mb-1">
          <strong>Usuario:</strong> {usuario.username}
        </p>

        <p className="mb-0">
          <strong>Email:</strong> {usuario.email}
        </p>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {vistaCliente === "productos" && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Productos disponibles</h2>

            <button
              className="btn btn-primary"
              onClick={() => setVistaCliente("carrito")}
            >
              Carrito ({carrito.length}) →
            </button>
          </div>

          <div className="row g-4">
            {productos.map((producto) => {
              const itemCarrito = carrito.find((item) => item.id === producto.id);
              const cantidad = itemCarrito ? itemCarrito.cantidad : 0;

              return (
                <div className="col-md-4" key={producto.id}>
                  <div className="card shadow-sm h-100 p-3">
                    <h4>{producto.nombre}</h4>

                    <p className="text-muted">{producto.descripcion}</p>

                    <p>
                      <strong>Precio:</strong> ${producto.precio}
                    </p>

                    <p>
                      <strong>Stock:</strong> {producto.stock}
                    </p>

                    {cantidad === 0 ? (
                      <button
                        className="btn btn-success mt-auto"
                        onClick={() => agregarAlCarrito(producto)}
                        disabled={producto.stock <= 0}
                      >
                        {producto.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
                      </button>
                    ) : (
                      <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => disminuirCantidad(producto.id)}
                          >
                            -
                          </button>

                          <strong>{cantidad} agregado(s)</strong>

                          <button
                            className="btn btn-outline-success"
                            onClick={() => agregarAlCarrito(producto)}
                            disabled={cantidad >= producto.stock}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="btn btn-primary w-100"
                          onClick={() => setVistaCliente("carrito")}
                        >
                          Ir al carrito →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {vistaCliente === "carrito" && (
        <div className="card shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Carrito</h2>

            <button
              className="btn btn-outline-secondary"
              onClick={() => setVistaCliente("productos")}
            >
              ← Volver a productos
            </button>
          </div>

          {carrito.length === 0 ? (
            <div className="alert alert-info">Tu carrito está vacío.</div>
          ) : (
            <>
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="border-bottom py-3 d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h5>{item.nombre}</h5>
                    <p className="mb-0">
                      {item.cantidad} x ${item.precio}
                    </p>
                    <small className="text-muted">
                      Subtotal: ${(Number(item.precio) * item.cantidad).toFixed(2)}
                    </small>
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => disminuirCantidad(item.id)}
                    >
                      -
                    </button>

                    <strong>{item.cantidad}</strong>

                    <button
                      className="btn btn-outline-success"
                      onClick={() => agregarAlCarrito(item)}
                      disabled={item.cantidad >= item.stock}
                    >
                      +
                    </button>

                    <button
                      className="btn btn-outline-danger"
                      onClick={() => quitarDelCarrito(item.id)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}

              <h4 className="mt-4">Total: ${totalCarrito.toFixed(2)}</h4>

              <button
                className="btn btn-primary w-100 mt-3"
                onClick={confirmarPedido}
              >
                Confirmar pedido →
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function PanelOperador({
  usuario,
  productos,
  nuevoProducto,
  setNuevoProducto,
  crearProducto,
  mensaje,
  error,
}) {
  return (
    <div>
      <div className="card shadow-sm p-4 mb-4 text-center">
        <h1>Panel Operador</h1>

        <p className="mb-1">
          <strong>Usuario:</strong> {usuario.username}
        </p>

        <p className="mb-0">
          <strong>Email:</strong> {usuario.email}
        </p>
      </div>

      <div className="row g-4">
        <div className="col-md-5">
          <div className="card shadow-sm p-4">
            <h3 className="mb-3 text-center">Crear producto</h3>

            {mensaje && <div className="alert alert-success">{mensaje}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={crearProducto}>
              <input
                className="form-control mb-3"
                placeholder="Nombre"
                value={nuevoProducto.nombre}
                onChange={(e) =>
                  setNuevoProducto({
                    ...nuevoProducto,
                    nombre: e.target.value,
                  })
                }
              />

              <textarea
                className="form-control mb-3"
                placeholder="Descripción"
                value={nuevoProducto.descripcion}
                onChange={(e) =>
                  setNuevoProducto({
                    ...nuevoProducto,
                    descripcion: e.target.value,
                  })
                }
              />

              <input
                className="form-control mb-3"
                type="number"
                placeholder="Precio"
                value={nuevoProducto.precio}
                onChange={(e) =>
                  setNuevoProducto({
                    ...nuevoProducto,
                    precio: e.target.value,
                  })
                }
              />

              <input
                className="form-control mb-3"
                type="number"
                placeholder="Stock"
                value={nuevoProducto.stock}
                onChange={(e) =>
                  setNuevoProducto({
                    ...nuevoProducto,
                    stock: e.target.value,
                  })
                }
              />

              <button className="btn btn-primary w-100">Crear producto</button>
            </form>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm p-4">
            <h3 className="mb-4">Productos registrados</h3>

            <div className="row g-3">
              {productos.map((producto) => (
                <div className="col-md-6" key={producto.id}>
                  <div className="border rounded p-3 h-100">
                    <h5>{producto.nombre}</h5>
                    <p>{producto.descripcion}</p>
                    <p>
                      <strong>Precio:</strong> ${producto.precio}
                    </p>
                    <p>
                      <strong>Stock:</strong> {producto.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;