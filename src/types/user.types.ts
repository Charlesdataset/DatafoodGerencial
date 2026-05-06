export const initialUser = {
  idUsuario: Number(localStorage.getItem("userIdTicket") || 0),
  nomeUsuario: localStorage.getItem("userNameTicket") || "",
  idEmpresa: Number(localStorage.getItem("companyTicket") || 0),
  permissoes: {
    dashView: getPermission("dashView"),
    eventView: getPermission("eventView"),
    eventEdi: getPermission("eventEdi"),
    grupView: getPermission("grupView"),
    grupCad: getPermission("grupCad"),
    grupEdi: getPermission("grupEdi"),
    grupDel: getPermission("grupDel"),
    prodView: getPermission("prodView"),
    prodCad: getPermission("prodCad"),
    prodEdi: getPermission("prodEdi"),
    prodDel: getPermission("prodDel"),
    usuView: getPermission("usuView"),
    usuCad: getPermission("usuCad"),
    usuEdi: getPermission("usuEdi"),
    usuDel: getPermission("usuDel"),
    caixaView: getPermission("caixaView"),
    frmpView: getPermission("frmpView"),
    frmpCad: getPermission("frmpCad"),
    frmpEdi: getPermission("frmpEdi"),
    frmpDel: getPermission("frmpDel"),
    maqView: getPermission("maqView"),
    maqCad: getPermission("maqCad"),
    maqEdi: getPermission("maqEdi"),
    setaPermissao: getPermission("setaPermissao"),
  },
};

function getPermission(key: string): boolean {
  const dataRoute = localStorage.getItem("dataRoute");
  if (!dataRoute) return false;
  try {
    return JSON.parse(dataRoute)[key] === true;
  } catch {
    return false;
  }
}
