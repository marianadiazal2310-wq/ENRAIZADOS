const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud");
  }

  return data;
};

export const getProducts=()=>request("/products");
export const sendContact=payload=>request("/contact",{method:"POST",body:JSON.stringify(payload)});
export const askAssistant=(message,history=[])=>request("/assistant",{method:"POST",body:JSON.stringify({message,history})});
export const adminLogin=(email,password)=>request("/auth/login",{method:"POST",body:JSON.stringify({email,password})});
export const createProduct=(product,token)=>request("/products",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify(product)});export const updateProduct=(id,product,token)=>
  request(`/products/${id}`,{
    method:"PATCH",
    headers:{Authorization:`Bearer ${token}`},
    body:JSON.stringify(product)
  });

export const deleteProduct=(id,token)=>
  request(`/products/${id}`,{
    method:"DELETE",
    headers:{Authorization:`Bearer ${token}`}
  });