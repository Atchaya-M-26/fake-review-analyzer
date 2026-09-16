from pathlib import Path

from src.model_pipeline import ReviewModelPipeline


def main() -> None:
    service_root = Path(__file__).resolve().parent
    pipeline = ReviewModelPipeline(service_root=service_root)
    metadata = pipeline.train_from_csv(service_root / 'data' / 'training_reviews.csv')

    print('Training complete')
    print(f"Best model: {metadata.get('best_model')}")
    print(f"Training samples: {metadata.get('trained_samples')}")
    print(f"Results: {metadata.get('results')}")


if __name__ == '__main__':
    main()