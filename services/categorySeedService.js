import Category from '../models/Category.js';
import defaultCategories from '../data/defaultCategories.js';

export const seedDefaultCategories = async () => {
    await Promise.all(defaultCategories.map((category) => (
        Category.updateOne(
            { name: category.name },
            { $setOnInsert: category },
            { upsert: true }
        )
    )));
};
