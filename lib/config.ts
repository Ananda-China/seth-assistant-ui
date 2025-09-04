// 配置文件 - 控制是否使用 Supabase
// 在 Vercel（无持久磁盘）环境下，默认启用 Supabase
// 本地开发如果未显式设置，则默认使用本地文件存储
const isVercel = !!process.env.VERCEL;
export const USE_SUPABASE = process.env.USE_SUPABASE
  ? process.env.USE_SUPABASE === 'true'
  : isVercel;

// 根据配置动态导入相应的模块
export const getUsersModule = async () => {
  if (USE_SUPABASE) {
    return await import('./users-supabase');
  } else {
    return await import('./users');
  }
};

export const getStoreModule = async () => {
  if (USE_SUPABASE) {
    return await import('./store-supabase');
  } else {
    return await import('./store');
  }
};

export const getBillingModule = async () => {
  if (USE_SUPABASE) {
    return await import('./billing-supabase');
  } else {
    return await import('./billing');
  }
};

// 辅助函数，用于在 API 路由中使用
export async function getUsers() {
  const module = await getUsersModule();
  return module;
}

export async function getStore() {
  const module = await getStoreModule();
  return module;
}

export async function getBilling() {
  const module = await getBillingModule();
  return module;
}
