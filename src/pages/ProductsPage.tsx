import React, { useState } from 'react';
import { ProductItem } from '../types';
import { useStore } from '../data/store';
import { ProductDetailModal } from '../components/ProductDetailModal';
import {
  ShoppingBag,
  MessageCircle,
  Eye,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { products, store } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = [
    'Todos',
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Catálogo Exclusivo Yeshua</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display uppercase tracking-wider text-neutral-100">
          Produtos & Cosméticos
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
          Pomadas modeladoras, óleos nutritivos para barba, tônicos e cosméticos para cuidado diário em casa. Venda e dúvidas atendidas direto pelo WhatsApp com retirada no Centro de Manaus.
        </p>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800">
          <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-neutral-300">
            Nenhum produto cadastrado nesta categoria
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Cadastre novos produtos facilmente na Área Administrativa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div
                onClick={() => setSelectedProduct(product)}
                className="cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-neutral-950">
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-neutral-950/80 text-amber-300 border border-amber-500/20 backdrop-blur-xs">
                      {product.category}
                    </span>
                  </div>

                  {!product.available && (
                    <div className="absolute inset-0 bg-neutral-950/70 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold uppercase tracking-wider">
                        Esgotado temporariamente
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    {product.available ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Disponível
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Consulte estoque
                      </span>
                    )}

                    {product.additionalImages && product.additionalImages.length > 0 && (
                      <span className="text-neutral-500 text-[11px]">
                        +{product.additionalImages.length} fotos
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold font-display text-neutral-100 group-hover:text-amber-200 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="pt-2 text-2xl font-bold font-display text-amber-400">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalhes</span>
                </button>
                <a
                  href={store.buildProductInquiryUrl(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
