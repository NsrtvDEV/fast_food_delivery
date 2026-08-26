import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw, X, ImagePlus } from 'lucide-react'
import { AdminLayout } from '../components/AdminLayout'
import { AdminModal } from '../components/AdminModal'
import { catalogApi, type Category, type Product } from '../api/client'

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  function load() {
    Promise.all([catalogApi.categories(), catalogApi.allProducts()])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods)
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const categoryById = new Map(categories.map((c) => [c.id, c]))

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      await catalogApi.createCategory(newCategory.trim())
      setNewCategory('')
      toast.success('Категория добавлена')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Удалить категорию?')) return
    try {
      await catalogApi.deleteCategory(id)
      toast.success('Категория удалена')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      await catalogApi.updateProduct(product.id, { is_active: !product.is_active })
      toast.success(product.is_active ? 'Товар скрыт' : 'Товар восстановлен')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Удалить "${product.name}"?`)) return
    try {
      await catalogApi.deleteProduct(product.id)
      toast.success('Товар удалён')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <AdminLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-slate-900">Категории</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pl-3 pr-1.5 text-sm font-medium text-slate-700"
            >
              {c.name}
              <button
                type="button"
                onClick={() => handleDeleteCategory(c.id)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <form onSubmit={handleAddCategory} className="flex items-center gap-1.5">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Новая категория"
              className="w-36 rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Товары</h2>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Добавить товар
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Товар</th>
                  <th className="py-2 pr-3">Категория</th>
                  <th className="py-2 pr-3">Цена</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2 pr-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {p.image_id && (
                            <img
                              src={catalogApi.productImageUrl(p.image_id)}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {categoryById.get(p.category_id)?.name ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">
                      {p.price.toLocaleString('ru-RU')} сум
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.is_active ? 'Активен' : 'Скрыт'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          title="Редактировать"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          title={p.is_active ? 'Скрыть' : 'Восстановить'}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          title="Удалить"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateProductModal
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          load()
        }}
      />

      <EditProductModal
        product={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    </AdminLayout>
  )
}

function CreateProductModal({
  open,
  categories,
  onClose,
  onCreated,
}: {
  open: boolean
  categories: Category[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setPrice('')
      setCategoryId(categories[0] ? String(categories[0].id) : '')
      setImage(null)
    }
  }, [open, categories])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!image || !categoryId) {
      toast.error('Заполните все поля и выберите фото')
      return
    }
    setSaving(true)
    try {
      await catalogApi.createProduct({
        category_id: Number(categoryId),
        name,
        description,
        price: Number(price),
        image,
      })
      toast.success('Товар создан')
      onCreated()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={open} title="Новый товар" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="admin-input"
          />
        </FormField>
        <FormField label="Описание">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className="admin-input resize-none"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Цена (сум)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="admin-input"
            />
          </FormField>
          <FormField label="Категория">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="admin-input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Фото">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-brand-400">
            <ImagePlus className="h-4 w-4" />
            {image ? image.name : 'Выбрать файл'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
        </FormField>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Создать товар'}
        </button>
      </form>
    </AdminModal>
  )
}

function EditProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description)
      setPrice(String(product.price))
      setCategoryId(String(product.category_id))
      setImage(null)
    }
  }, [product])

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const previewUrl =
    imagePreviewUrl ?? (product?.image_id ? catalogApi.productImageUrl(product.image_id) : null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      await catalogApi.updateProduct(product.id, {
        name,
        description,
        price: Number(price),
        category_id: Number(categoryId),
      })
      if (image) {
        await catalogApi.updateProductImage(product.id, image)
      }
      toast.success('Товар обновлён')
      onSaved()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={!!product} title="Редактировать товар" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormField label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="admin-input"
          />
        </FormField>
        <FormField label="Описание">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className="admin-input resize-none"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Цена (сум)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="admin-input"
            />
          </FormField>
          <FormField label="Категория">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="admin-input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Фото">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-brand-400">
            {previewUrl && (
              <img src={previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
            )}
            <span className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {image ? image.name : 'Заменить фото'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
        </FormField>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </AdminModal>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}
