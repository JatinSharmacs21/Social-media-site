import React from "react";

function FeedPageStyles() {
  return (
      <style>
        {`
          @keyframes vybeCardIn {
            from { opacity: 0; transform: translateY(14px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .animate-vybe-card {
            animation: vybeCardIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          @keyframes galleryNext {
            from { opacity: 0.65; transform: translateX(22px) scale(0.985); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          @keyframes galleryPrev {
            from { opacity: 0.65; transform: translateX(-22px) scale(0.985); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }

          .animate-gallery-next {
            animation: galleryNext 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .animate-gallery-prev {
            animation: galleryPrev 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          @keyframes uploadFlow {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(20%); }
            100% { transform: translateX(160%); }
          }

          @keyframes vybeSheetUp {
            from { opacity: 0; transform: translateY(18px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .animate-vybe-sheet {
            animation: vybeSheetUp 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

        `}
      </style>
  );
}

export default FeedPageStyles;
