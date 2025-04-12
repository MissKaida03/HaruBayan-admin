const SUPABASE_URL = 'https://lngdoqimxolarajflobo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZ2RvcWlteG9sYXJhamZsb2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MjQ5MDQsImV4cCI6MjA2MDAwMDkwNH0.hDroH3E7cq-RHh8iGsbg5s1tdYVSHMI94ZSZXzoABic'; // Replace with actual key
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('recipe-form');
const status = document.getElementById('status');
const recipesList = document.getElementById('recipes-list');
const searchBar = document.getElementById('search-bar');
const sortCategory = document.getElementById('sort-category');

// Handle form submission (Add or Update Recipe)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = 'Processing...';

  const id = document.getElementById('recipe-id').value;
  const name = document.getElementById('name').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;
  const imageFile = document.getElementById('image').files[0];
  let image_url = null;

  try {
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('recipe-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = await client.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      image_url = urlData.publicUrl;
    }

    if (id) {
      // Update existing recipe
      const { data: oldData } = await client.from('recipes').select('image_url').eq('id', id).single();
      if (image_url && oldData?.image_url) {
        const oldPath = oldData.image_url.split('/').slice(-2).join('/');
        await client.storage.from('recipe-images').remove([oldPath]);
      }

      const { error: updateError } = await client
        .from('recipes')
        .update({ name, category, description, ...(image_url && { image_url }) })
        .eq('id', id);

      if (updateError) throw updateError;

      status.textContent = 'Recipe updated!';
    } else {
      // Add new recipe
      const { error: insertError } = await client
        .from('recipes')
        .insert([{ name, category, description, image_url }]);

      if (insertError) throw insertError;

      status.textContent = 'Recipe added!';
    }

    form.reset();
    document.getElementById('recipe-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Recipe';
    loadRecipes(); // Reload recipes after adding or updating
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + err.message;
  }
});

// Load existing recipes when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadRecipes(); // Load recipes when the page loads
});

// Load recipes from Supabase with search and category filter
async function loadRecipes() {
  const searchQuery = searchBar.value.toLowerCase();
  const selectedCategory = sortCategory.value;

  let query = client.from('recipes').select('*').order('created_at', { ascending: false });

  // Apply search filter by name
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Apply sort filter by category
  if (selectedCategory) {
    query = query.eq('category', selectedCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading:', error);
    return;
  }

  recipesList.innerHTML = ''; // Clear the existing list
  data.forEach(recipe => {
    const div = document.createElement('div');
    div.className = 'recipe-card';
    div.innerHTML = `
      <strong>${recipe.name}</strong> (${recipe.category})<br>
      <img class="recipe-img" src="${recipe.image_url}" alt="${recipe.name}" /><br>
      <em>${recipe.description}</em><br>
      <small>Created: ${new Date(recipe.created_at).toLocaleString()}</small><br>
      <button onclick="editRecipe(${recipe.id})">Edit</button>
      <button onclick="deleteRecipe(${recipe.id}, '${recipe.image_url}')">Delete</button>
    `;
    recipesList.appendChild(div);
  });
}

// Event listener for search input
searchBar.addEventListener('input', () => {
  loadRecipes(); // Reload recipes with updated search filter
});

// Event listener for category sort dropdown
sortCategory.addEventListener('change', () => {
  loadRecipes(); // Reload recipes with updated sort filter
});

async function editRecipe(id) {
  // Display a confirmation prompt directly in the form
  const confirmEdit = confirm("Are you sure you want to edit this recipe?");
  
  if (confirmEdit) {
    // Fetch the recipe data
    const { data, error } = await client.from('recipes').select('*').eq('id', id).single();
    if (error) return alert('Error fetching recipe');
  
    // Populate the form with the recipe data
    document.getElementById('recipe-id').value = data.id;
    document.getElementById('name').value = data.name;
    document.getElementById('category').value = data.category;
    document.getElementById('description').value = data.description;
    document.getElementById('form-title').textContent = 'Edit Recipe';
  } else {
    // If user cancels, do nothing
    return;
  }
}

  

/// Delete recipe function
async function deleteRecipe(id, image_url) {
    // Ask for confirmation before deleting
    if (!confirm('Are you sure you want to delete this recipe?')) return;
  
    // Delete recipe record from the database
    const { error } = await client.from('recipes').delete().eq('id', id);
    if (error) return alert('Failed to delete recipe');  // Show error if deletion fails
  
    // If the recipe has an image URL, delete the image from Supabase storage
    if (image_url) {
      const path = image_url.split('/').slice(-2).join('/');  // Extract the file path from the URL
      await client.storage.from('recipe-images').remove([path]);  // Remove the image file from Supabase storage
    }
  
    // Reload the recipe list after deletion
    loadRecipes();
  }

  // Attach functions to global scope so they work in onclick
window.editRecipe = editRecipe;
window.deleteRecipe = deleteRecipe;

  
// Toggle dropdown menu
const userIcon = document.querySelector('.user-icon');
const dropdown = document.querySelector('.dropdown');

userIcon.addEventListener('click', () => {
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    dropdown.style.display = 'none';
  }
});

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", function () {
  console.log("Redirecting...");
  window.location.href = "../../authentication/adminLOGIN.html";
});
