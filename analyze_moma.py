import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset
file_path = 'data/MoMA-artworks-continent.csv'  # Replace with the actual file path
artworks_data = pd.read_csv(file_path)

# Display the first few rows of the dataset
print("First few rows of the dataset:")
print(artworks_data.head())

# Display summary statistics of the dataset
print("\nSummary statistics of the dataset:")
print(artworks_data.describe(include='all'))

# Most Common Mediums
medium_distribution = artworks_data['Medium'].value_counts().head(10)
print("\nTop 10 Most Common Mediums:")
print(medium_distribution)

# Gender Distribution of Artists
gender_distribution = artworks_data['Gender'].value_counts()
print("\nGender Distribution of Artists:")
print(gender_distribution)

# Nationality Distribution of Artists (top 10)
nationality_distribution = artworks_data['Nationality'].value_counts().head(10)
print("\nTop 10 Nationalities of Artists:")
print(nationality_distribution)

# Yearly Acquisition Trends
artworks_data['YearAcquired'] = pd.to_datetime(artworks_data['Date Acquired']).dt.year
yearly_acquisitions = artworks_data['YearAcquired'].value_counts().sort_index()
print("\nYearly Acquisition Trends:")
print(yearly_acquisitions)

# Plotting the results
plt.figure(figsize=(15, 10))

# Plot Medium Distribution
plt.subplot(2, 2, 1)
medium_distribution.plot(kind='bar', color='skyblue')
plt.title('Top 10 Most Common Mediums')
plt.xlabel('Medium')
plt.ylabel('Count')

# Plot Gender Distribution
plt.subplot(2, 2, 2)
gender_distribution.plot(kind='bar', color='lightgreen')
plt.title('Gender Distribution of Artists')
plt.xlabel('Gender')
plt.ylabel('Count')

# Plot Nationality Distribution
plt.subplot(2, 2, 3)
nationality_distribution.plot(kind='bar', color='salmon')
plt.title('Top 10 Nationalities of Artists')
plt.xlabel('Nationality')
plt.ylabel('Count')

# Plot Yearly Acquisition Trends
plt.subplot(2, 2, 4)
yearly_acquisitions.plot(kind='line', marker='o', color='purple')
plt.title('Yearly Acquisition Trends')
plt.xlabel('Year')
plt.ylabel('Number of Acquisitions')

plt.tight_layout()
plt.show()
