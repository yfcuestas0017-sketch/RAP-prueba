import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCesmag from "../../assets/logo_unicesmag.png";
import logoGoogle from "../../assets/logo_google.jpg";
import "./login.css";
import { API_BASE_URL } from '../../config';

export default function Dashboard() {
  const navigate = useNavigate();
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [usuarioAdmin, setUsuarioAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [mostrarPasswordAdmin, setMostrarPasswordAdmin] = useState(false);
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const [cargandoAdmin, setCargandoAdmin] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setMensajeAdmin("");

    if (!usuarioAdmin.trim() || !passwordAdmin) {
      setMensajeAdmin("Ingrese usuario y contraseña para continuar.");
      return;
    }

    setCargandoAdmin(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuario: usuarioAdmin,
          password: passwordAdmin,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMensajeAdmin(data.mensaje || "Credenciales incorrectas.");
        return;
      }

      if (data.rol === "ADMIN") {
        navigate("/admin");
        return;
      }

      setMensajeAdmin("El usuario no tiene permisos de administrador.");
    } catch {
      setMensajeAdmin("Error conectando con el servidor.");
    } finally {
      setCargandoAdmin(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Información del Sistema RAP">
        <div className="brand-decoration brand-decoration-one" />
        <div className="brand-decoration brand-decoration-two" />
        <div className="cesmag-logo">
          <img src={logoCesmag} alt="Universidad CESMAG" />
        </div>
        <div className="brand-copy">
          <h1>Sistema RAP CESMAG</h1>
          <p className="brand-title">Gestión de Resultados de Aprendizaje</p>
          <p>Programa de Ingeniería de Sistemas</p>
          <p>Seguimiento y evaluación académica</p>
        </div>
        <footer>Universidad CESMAG - Pasto, Nariño</footer>
      </section>

      <section className="login-panel">
        <div className="login-content">
          <div className="login-heading">
            <h2>Iniciar sesión</h2>
            <p>Ingresa con tus credenciales institucionales para continuar.</p>
          </div>

          <div className="login-form">
            <p className="audience-label">Docentes y estudiantes</p>
            <button
              className="google-button"
              type="button"
              onClick={handleGoogleLogin}
            >
              <img className="google-mark" src={logoGoogle} alt="" />
              Acceder con Google
            </button>
          </div>

          <div className="admin-access">
            <button
              type="button"
              className="admin-link"
              onClick={() => {
                setMostrarAdmin(!mostrarAdmin);
                setMensajeAdmin("");
              }}
              aria-expanded={mostrarAdmin}
            >
              {mostrarAdmin ? "Ocultar acceso administrador" : "Acceso administradores"}
            </button>

            {mostrarAdmin && (
              <form className="admin-form" onSubmit={handleAdminLogin}>
                <h3>Acceso administradores</h3>
                <div className="form-field">
                  <label htmlFor="usuario-admin">Usuario</label>
                  <input
                    id="usuario-admin"
                    type="text"
                    value={usuarioAdmin}
                    onChange={(event) => setUsuarioAdmin(event.target.value)}
                    placeholder="Ingrese su usuario"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="password-admin">Contraseña</label>
                  <div className="password-input">
                    <input
                      id="password-admin"
                      type={mostrarPasswordAdmin ? "text" : "password"}
                      value={passwordAdmin}
                      onChange={(event) => setPasswordAdmin(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setMostrarPasswordAdmin(!mostrarPasswordAdmin)
                      }
                      aria-label={
                        mostrarPasswordAdmin
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPasswordAdmin ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={cargandoAdmin}
                >
                  {cargandoAdmin ? "Ingresando..." : "Entrar"}
                </button>
                {mensajeAdmin && (
                  <p className="inline-message error-message" role="alert">
                    {mensajeAdmin}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
