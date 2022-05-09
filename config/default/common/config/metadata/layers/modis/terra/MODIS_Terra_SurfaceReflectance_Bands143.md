**8 November 2020 Notice**: The MODIS instrument aboard the Terra satellite experienced a Printed Wire Assembly (PWA) failure on 5 October 2020. This has resulted in a reduction in the overall Terra daytime coverage and many of the MODIS/Terra imagery layers have a slightly jagged appearance with less coverage over the northern high latitude regions. This issue will affect land daytime MODIS/Terra products that primarily rely on the Reflective Solar Bands (RSB) (i.e. visible bands) indefinitely. [Learn more about the issue](https://landweb.modaps.eosdis.nasa.gov/cgi-bin/QA_WWW/displayCase.cgi?esdt=MOD&caseNum=PM_MOD_20280&caseLocation=cases_data&type=C6).

---

True Color: Red = Band 1, Green = Band 4, Blue = Band 3

These images are called true-color or natural color because this combination of wavelengths is similar to what the human eye would see. The images are natural-looking images of land surface, oceanic and atmospheric features.

The MODIS Land Surface Reflectance product is available from both the Terra (MOD09) and Aqua (MYD09) satellites. The sensor resolution is 500 m, imagery resolution is 500 m, and the temporal resolution is daily.

### MODIS Corrected Reflectance vs. MODIS Surface Reflectance

The MODIS Corrected Reflectance algorithm utilizes MODIS Level 1B data (the calibrated, geolocated radiances). It is not a standard, science quality product. The purpose of this algorithm is to provide natural-looking images by removing gross atmospheric effects, such as Rayleigh scattering, from MODIS visible bands 1-7. The algorithm was developed by the original MODIS Rapid Response team to address the needs of the fire monitoring community who want to see smoke. Corrected Reflectance shows smoke more clearly than the standard Surface Reflectance product. In contrast, the MODIS Land Surface Reflectance product (MOD09) is a more complete atmospheric correction algorithm that includes aerosol correction, and is designed to derive land surface properties. In clear atmospheric conditions the Corrected Reflectance product is very similar to the MOD09 product, but they depart from each other in presence of aerosols. If you wish to perform a complete atmospheric correction, please do not use the Corrected Reflectance algorithm. An additional difference is that the Land Surface Reflectance product is only tuned for calculating the reflectance over land surfaces.

References: [MODAPS - MOD09](https://modaps.modaps.eosdis.nasa.gov/services/about/products/c6-nrt/MOD09.html);[MODAPS - MYD09](https://modaps.modaps.eosdis.nasa.gov/services/about/products/c6-nrt/MYD09.html); [NASA Earthdata - Creating Reprojected True Color MODIS Images: A Tutorial](https://earthdata.nasa.gov/files/MODIS_True_Color.pdf)